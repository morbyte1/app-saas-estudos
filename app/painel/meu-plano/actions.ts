'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { calcularDistribuicaoSugerida } from '@/lib/planCalculo'
import cursosJson from '@/data/cursos.json'

export async function getMeuPlanoData() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Usuário não autenticado' }

  const [settingsRes, materiasRes, contextRes, sessionsRes] = await Promise.all([
    supabase.from('user_plan_settings').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('materias').select('id, name, goal_hours').eq('user_id', user.id),
    supabase.from('user_objective_context').select('curso_id, nivel_percebido').eq('user_id', user.id).maybeSingle(),
    supabase.from('study_sessions').select('materia_id, duration_seconds, session_date').eq('user_id', user.id)
  ])

  const now = new Date()
  now.setUTCHours(now.getUTCHours() - 3)
  const currentDayOfWeek = now.getUTCDay() === 0 ? 7 : now.getUTCDay()
  const startOfWeek = new Date(now)
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - currentDayOfWeek + 1)
  
  const getYYYYMMDD = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  const startOfWeekStr = getYYYYMMDD(startOfWeek)

  const weekSessions = (sessionsRes.data || []).filter(s => s.session_date >= startOfWeekStr)

  let settings = settingsRes.data
  if (!settings) {
    settings = { horas_dias_semana: 2, horas_sabado: 3, horas_domingo: 3, redacao_frequencia_semanal: 1, prioridades_manuais: {}, horas_manuais_override: {} }
  }

  const totalHorasDisponiveis = (settings.horas_dias_semana * 5) + settings.horas_sabado + settings.horas_domingo
  const materias = materiasRes.data || []
  
  const context = contextRes.data || { curso_id: null, nivel_percebido: {} }

  // CORREÇÃO 3: Cálculo e desconto das horas de redação
  const HORAS_POR_REDACAO = 1
  const horasRedacaoSemana = (settings.redacao_frequencia_semanal || 0) * HORAS_POR_REDACAO
  const horasDisponiveisParaMaterias = Math.max(totalHorasDisponiveis - horasRedacaoSemana, 0)
  
  const distribuicaoBase = calcularDistribuicaoSugerida(
    materias,
    context.curso_id || null,
    context.nivel_percebido || {},
    horasDisponiveisParaMaterias, // <-- Usando horas descontadas
    settings.prioridades_manuais || {},
    settings.horas_manuais_override || {}
  )

  const distribuicao = distribuicaoBase.map(d => {
    const mSessions = weekSessions.filter(s => s.materia_id === d.id)
    const seconds = mSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
    
    // CORREÇÃO 5: Buscando o goal_hours do banco para comparar no Client
    const materiaOriginal = materias.find(m => m.id === d.id)

    return {
      ...d,
      weeklyStudiedHours: seconds / 3600,
      goalHoursAtual: materiaOriginal?.goal_hours || 1 
    }
  })

  let pesoRedacao = 1
  if (context.curso_id) {
    const curso = cursosJson.find(c => c.id === context.curso_id)
    if (curso && curso.pesos.redacao) pesoRedacao = curso.pesos.redacao
  }
  const sugestaoRedacao = pesoRedacao >= 3 ? 2 : 1

  return {
    success: true,
    data: {
      settings,
      distribuicao,
      cursoId: context.curso_id || null,
      sugestaoRedacao,
      totalHorasDisponiveis,
      horasRedacaoSemana
    }
  }
}

export async function salvarDisponibilidade(data: { horasDiasSemana: number, horasSabado: number, horasDomingo: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: existing } = await supabase.from('user_plan_settings').select('id').eq('user_id', user.id).maybeSingle()
  
  const payload = {
    horas_dias_semana: data.horasDiasSemana,
    horas_sabado: data.horasSabado,
    horas_domingo: data.horasDomingo,
    updated_at: new Date().toISOString()
  }

  if (existing) {
    await supabase.from('user_plan_settings').update(payload).eq('id', existing.id)
  } else {
    await supabase.from('user_plan_settings').insert({ user_id: user.id, ...payload })
  }

  revalidatePath('/dashboard/meu-plano')
  return { success: true }
}

export async function salvarFrequenciaRedacao(frequencia: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: existing } = await supabase.from('user_plan_settings').select('id').eq('user_id', user.id).maybeSingle()
  
  if (existing) {
    await supabase.from('user_plan_settings').update({ redacao_frequencia_semanal: frequencia }).eq('id', existing.id)
  } else {
    await supabase.from('user_plan_settings').insert({ user_id: user.id, redacao_frequencia_semanal: frequencia })
  }

  revalidatePath('/dashboard/meu-plano')
  return { success: true }
}

export async function ajustarHorasManualMateria(materiaId: string, horas: number | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: existing } = await supabase.from('user_plan_settings').select('id, horas_manuais_override').eq('user_id', user.id).maybeSingle()
  
  const overrides = existing?.horas_manuais_override || {}
  
  if (horas === null) {
    delete overrides[materiaId]
  } else {
    overrides[materiaId] = horas
  }

  if (existing) {
    await supabase.from('user_plan_settings').update({ horas_manuais_override: overrides }).eq('id', existing.id)
  } else {
    await supabase.from('user_plan_settings').insert({ user_id: user.id, horas_manuais_override: overrides })
  }

  revalidatePath('/dashboard/meu-plano')
  return { success: true }
}

export async function aplicarDistribuicaoAsMateriasGoalHours(distribuicao: Record<string, number>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  for (const [materiaId, hours] of Object.entries(distribuicao)) {
    await supabase.from('materias').update({ goal_hours: hours }).eq('id', materiaId).eq('user_id', user.id)
  }

  await supabase.from('user_plan_settings').update({ updated_at: new Date().toISOString() }).eq('user_id', user.id)

  revalidatePath('/dashboard/materias')
  revalidatePath('/dashboard/meu-plano')
  return { success: true }
}