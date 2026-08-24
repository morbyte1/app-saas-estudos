'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Materia {
  id: string
  name: string
  goalHours: number
  studiedHours: number
  studiedMinutes: number
  progress: number
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

  const { data: materias, error } = await supabase
    .from('materias')
    .select('studied_hours, studied_minutes, progress')
    .eq('user_id', user.id)

  if (error) {
    console.error('Erro ao buscar estatísticas:', error.message)
    return { error: error.message }
  }

  if (!materias || materias.length === 0) {
    return {
      success: true,
      data: {
        totalFocus: "0h 0min",
        progress: "0%",
        activeSubjects: 0
      }
    }
  }

  let totalHours = 0
  let totalMinutes = 0
  let totalProgress = 0

  materias.forEach(m => {
    totalHours += m.studied_hours || 0
    totalMinutes += m.studied_minutes || 0
    totalProgress += Number(m.progress) || 0
  })

  totalHours += Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  const averageProgress = materias.length > 0 
    ? (totalProgress / materias.length).toFixed(1) 
    : 0

  return {
    success: true,
    data: {
      totalFocus: `${totalHours}h ${remainingMinutes}min`,
      progress: `${averageProgress}%`,
      activeSubjects: materias.length
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

  const formattedMaterias: Materia[] = (materias || []).map(m => ({
    id: m.id,
    name: m.name,
    goalHours: m.goal_hours,
    studiedHours: m.studied_hours,
    studiedMinutes: m.studied_minutes,
    progress: Number(m.progress)
  }))

  return { success: true, data: formattedMaterias }
}

export async function createMateria(data: { name: string, goalHours: number }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Usuário não autenticado' }
  }

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

  if (error) {
    console.error('Erro ao criar matéria:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/materias')

  const formattedMateria: Materia = {
    id: newMateria.id,
    name: newMateria.name,
    goalHours: newMateria.goal_hours,
    studiedHours: newMateria.studied_hours,
    studiedMinutes: newMateria.studied_minutes,
    progress: Number(newMateria.progress)
  }

  return { success: true, data: formattedMateria }
}

export async function updateMateria(id: string, data: { name: string, goalHours: number }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: updatedMateria, error } = await supabase
    .from('materias')
    .update({
      name: data.name,
      goal_hours: data.goalHours
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar matéria:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/materias')

  const formattedMateria: Materia = {
    id: updatedMateria.id,
    name: updatedMateria.name,
    goalHours: updatedMateria.goal_hours,
    studiedHours: updatedMateria.studied_hours,
    studiedMinutes: updatedMateria.studied_minutes,
    progress: Number(updatedMateria.progress)
  }

  return { success: true, data: formattedMateria }
}

export async function deleteMateria(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Usuário não autenticado' }
  }

  const { error } = await supabase
    .from('materias')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Erro ao excluir matéria:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/materias')
  return { success: true }
}