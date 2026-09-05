'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import fs from 'fs'
import path from 'path'

export interface Materia {
  id: string
  name: string
  goalHours: number
  studiedHours: number
  studiedMinutes: number
  progress: number
}

// Tipagem do arquivo JSON
export type EnemAssunto = string;
export type EnemTopico = { name: string; assuntos: EnemAssunto[] };
export type EnemMateria = { name: string; default_goal_ratio: number; topicos: EnemTopico[] };
export type EnemData = { vestibular: string; exam_target: { name: string; target_date: string }; materias: EnemMateria[] };

// Utilitário para pegar a data do início da semana (Domingo) no formato YYYY-MM-DD
const getStartOfWeekString = () => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) 
  return `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`
}

export async function getEstatisticas() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Usuário não autenticado' }
  }

  const [materiasRes, userSettingsRes, examGoalsRes] = await Promise.all([
    supabase.from('materias').select('id, goal_hours').eq('user_id', user.id),
    supabase.from('user_settings').select('daily_goal_hours').eq('user_id', user.id).maybeSingle(),
    supabase.from('exam_goals').select('name').eq('user_id', user.id).gte('target_date', new Date().toISOString()).order('target_date', { ascending: true }).limit(1)
  ])

  const materias = materiasRes.data
  const dailyGoalHours = userSettingsRes.data?.daily_goal_hours || 3
  const examGoalName = examGoalsRes.data && examGoalsRes.data.length > 0 ? examGoalsRes.data[0].name : null

  if (materiasRes.error) {
    console.error('Erro ao buscar estatísticas:', materiasRes.error.message)
    return { error: materiasRes.error.message }
  }

  if (!materias || materias.length === 0) {
    return {
      success: true,
      data: {
        totalFocus: "0h 0min",
        progress: "0%",
        activeSubjects: 0,
        dailyGoalHours,
        examGoalName
      }
    }
  }

  // Busca as sessões de estudo da semana atual
  const startOfWeekStr = getStartOfWeekString()
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('materia_id, duration_seconds')
    .eq('user_id', user.id)
    .gte('session_date', startOfWeekStr)

  let totalSeconds = 0
  const progressPorMateria = new Map<string, { duration: number, goal: number }>()

  materias.forEach(m => {
    progressPorMateria.set(m.id, { duration: 0, goal: m.goal_hours || 0 })
  })

  if (sessions) {
    sessions.forEach(s => {
      totalSeconds += s.duration_seconds || 0
      if (s.materia_id && progressPorMateria.has(s.materia_id)) {
        progressPorMateria.get(s.materia_id)!.duration += s.duration_seconds || 0
      }
    })
  }

  let totalProgress = 0
  progressPorMateria.forEach(val => {
    if (val.goal > 0) {
      const studiedHours = val.duration / 3600
      const p = Math.min((studiedHours / val.goal) * 100, 100)
      totalProgress += p
    }
  })

  const totalHours = Math.floor(totalSeconds / 3600)
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60)

  const averageProgress = materias.length > 0 
    ? (totalProgress / materias.length).toFixed(1) 
    : 0

  return {
    success: true,
    data: {
      totalFocus: `${totalHours}h ${remainingMinutes}min`,
      progress: `${averageProgress}%`,
      activeSubjects: materias.length,
      dailyGoalHours,
      examGoalName
    }
  }
}

export async function getMaterias() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: materias, error } = await supabase
    .from('materias')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar matérias:', error.message)
    return { error: error.message }
  }

  // Busca o histórico da semana para calcular horas e progresso
  const startOfWeekStr = getStartOfWeekString()
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('materia_id, duration_seconds')
    .eq('user_id', user.id)
    .gte('session_date', startOfWeekStr)

  const sessionDurations = new Map<string, number>()
  if (sessions) {
    sessions.forEach(s => {
      if (s.materia_id) {
        sessionDurations.set(s.materia_id, (sessionDurations.get(s.materia_id) || 0) + (s.duration_seconds || 0))
      }
    })
  }

  const formattedMaterias: Materia[] = (materias || []).map(m => {
    const totalSeconds = sessionDurations.get(m.id) || 0
    const studiedHours = Math.floor(totalSeconds / 3600)
    const studiedMinutes = Math.floor((totalSeconds % 3600) / 60)
    const goalHours = m.goal_hours || 1 // evita divisão por zero
    const progress = Math.min(Math.round(((totalSeconds / 3600) / goalHours) * 100), 100)

    return {
      id: m.id,
      name: m.name,
      goalHours: m.goal_hours,
      studiedHours,
      studiedMinutes,
      progress
    }
  })

  return { success: true, data: formattedMaterias }
}

export async function importEnemDataAction(dailyHours: number) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Usuário não autenticado' }

  try {
    const filePath = path.join(process.cwd(), 'data', 'enem.json')
    if (!fs.existsSync(filePath)) {
       return { error: 'Arquivo de trilha não encontrado no servidor.' }
    }
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const enemData: EnemData = JSON.parse(fileContents)

    const weeklyHours = dailyHours * 7

    // Mapeando a carga horária de cada matéria baseado no ratio do JSON
    const payload = enemData.materias.map(m => ({
      name: m.name,
      goal_hours: Math.max(1, Math.round(weeklyHours * m.default_goal_ratio)),
      topicos: m.topicos
    }))

    // Chamando a Stored Procedure para garantir consistência e performance
    const { error: rpcError } = await supabase.rpc('import_enem_data', {
      p_user_id: user.id,
      p_materias: payload
    })

    if (rpcError) throw rpcError

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/materias')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao importar trilha ENEM:', error.message)
    return { error: error.message }
  }
}

export async function createMateria(data: { name: string, goalHours: number }) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Usuário não autenticado' }

  const { data: newMateria, error } = await supabase
    .from('materias')
    .insert({
      user_id: user.id,
      name: data.name,
      goal_hours: data.goalHours,
      studied_hours: 0,
      studied_minutes: 0,
      progress: 0
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/materias')
  return { success: true, data: { ...newMateria, goalHours: newMateria.goal_hours, studiedHours: 0, studiedMinutes: 0, progress: 0 } as Materia }
}

export async function updateMateria(id: string, data: { name: string, goalHours: number }) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Usuário não autenticado' }

  const { data: updatedMateria, error } = await supabase
    .from('materias')
    .update({ name: data.name, goal_hours: data.goalHours })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/materias')
  return { success: true, data: { ...updatedMateria, goalHours: updatedMateria.goal_hours, studiedHours: updatedMateria.studied_hours, studiedMinutes: updatedMateria.studied_minutes, progress: Number(updatedMateria.progress) } as Materia }
}

export async function deleteMateria(id: string) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase
    .from('materias')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/materias')
  return { success: true }
}