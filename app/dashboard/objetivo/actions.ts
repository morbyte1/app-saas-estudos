'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getObjetivoData() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) return { error: 'Usuário não autenticado' }

  const [examGoalsRes, contextRes, materiasRes] = await Promise.all([
    supabase.from('exam_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
    supabase.from('user_objective_context').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('materias').select('id, name').eq('user_id', user.id).order('name', { ascending: true })
  ])

  return {
    success: true,
    data: {
      examGoal: examGoalsRes.data?.[0] || null,
      context: contextRes.data || null,
      materias: materiasRes.data || []
    }
  }
}

export async function saveOnboardingComplete(data: {
  examName: string
  examDate: string
  curso: string
  niveis: Record<string, string>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { data: existingGoals } = await supabase.from('exam_goals').select('id').eq('user_id', user.id)
  
  if (existingGoals && existingGoals.length > 0) {
    await supabase.from('exam_goals').update({ name: data.examName, target_date: data.examDate }).eq('id', existingGoals[0].id)
  } else {
    await supabase.from('exam_goals').insert({ user_id: user.id, name: data.examName, target_date: data.examDate })
  }

  const { data: existingContext } = await supabase.from('user_objective_context').select('id').eq('user_id', user.id).maybeSingle()

  const payload = {
    user_id: user.id,
    curso_desejado: data.curso || null,
    nivel_percebido: data.niveis,
    onboarding_completo: true,
    updated_at: new Date().toISOString()
  }

  if (existingContext) {
    await supabase.from('user_objective_context').update(payload).eq('id', existingContext.id)
  } else {
    await supabase.from('user_objective_context').insert(payload)
  }

  revalidatePath('/dashboard/objetivo')
  return { success: true }
}

export async function updateCursoDesejado(data: {
  curso: string
  curso_id: string | null
  nota_alvo_geral: number | null
  nota_alvo_areas: Record<string, number> | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase.from('user_objective_context')
    .update({ 
      curso_desejado: data.curso, 
      curso_id: data.curso_id,
      nota_alvo_geral: data.nota_alvo_geral,
      nota_alvo_areas: data.nota_alvo_areas,
      updated_at: new Date().toISOString() 
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/objetivo')
  return { success: true }
}

export async function updateNivelMateria(materiaId: string, nivel: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { data: context } = await supabase.from('user_objective_context').select('id, nivel_percebido').eq('user_id', user.id).single()
  if (!context) return { error: 'Contexto de objetivo não encontrado.' }

  const currentNiveis = context.nivel_percebido || {}
  currentNiveis[materiaId] = nivel

  const { error } = await supabase.from('user_objective_context')
    .update({ nivel_percebido: currentNiveis, updated_at: new Date().toISOString() })
    .eq('id', context.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/objetivo')
  return { success: true }
}

export async function updateExamGoalTarget(examName: string, examDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { data: existingGoals } = await supabase.from('exam_goals').select('id').eq('user_id', user.id)
  
  if (existingGoals && existingGoals.length > 0) {
    await supabase.from('exam_goals').update({ name: examName, target_date: examDate }).eq('id', existingGoals[0].id)
  } else {
    await supabase.from('exam_goals').insert({ user_id: user.id, name: examName, target_date: examDate })
  }

  revalidatePath('/dashboard/objetivo')
  return { success: true }
}