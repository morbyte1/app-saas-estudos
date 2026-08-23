'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMateriaByName(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const decodedName = decodeURIComponent(name)

  const { data, error } = await supabase
    .from('materias')
    .select('*')
    .eq('user_id', user.id)
    .ilike('name', decodedName)
    .single()

  if (error) return { error: error.message }
  return { materia: data }
}

export async function getTopicosEAssuntos(materiaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: topicos, error: topicosError } = await supabase
    .from('topicos')
    .select('*')
    .eq('materia_id', materiaId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const { data: assuntos, error: assuntosError } = await supabase
    .from('assuntos')
    .select('*')
    .in('topico_id', topicos?.map(t => t.id) || [])
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (topicosError || assuntosError) {
    return { error: 'Erro ao buscar dados' }
  }

  return { topicos: topicos || [], assuntos: assuntos || [] }
}

export async function createTopico(materiaId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('topicos')
    .insert({ materia_id: materiaId, user_id: user.id, name })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/materias/[materia]', 'page')
  return { topico: data }
}

export async function createAssunto(topicoId: string, name: string, durationMinutes: number = 60) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('assuntos')
    .insert({ topico_id: topicoId, user_id: user.id, name, duration_minutes: durationMinutes })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/materias/[materia]', 'page')
  return { assunto: data }
}

export async function updateAssunto(assuntoId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('assuntos')
    .update({ name })
    .eq('id', assuntoId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/materias/[materia]', 'page')
  return { assunto: data }
}

export async function deleteAssunto(assuntoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('assuntos')
    .delete()
    .eq('id', assuntoId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/materias/[materia]', 'page')
  return { success: true }
}

export async function toggleAssunto(assuntoId: string, isDone: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('assuntos')
    .update({ is_done: isDone })
    .eq('id', assuntoId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/materias/[materia]', 'page')
  return { success: true }
}