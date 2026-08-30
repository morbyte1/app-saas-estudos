'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMateriaByName(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('materias')
    .select('*')
    .eq('user_id', user.id)
    .ilike('name', name) 
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

  // Puxar o histórico do Timer para somar o tempo real de cada Assunto
  const assuntoIds = assuntos?.map(a => a.id) || []
  const sessionDurations: Record<string, number> = {}

  if (assuntoIds.length > 0) {
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('assunto_id, duration_seconds')
      .in('assunto_id', assuntoIds)
      .eq('user_id', user.id)

    if (sessions) {
      sessions.forEach(session => {
        if (!sessionDurations[session.assunto_id]) {
          sessionDurations[session.assunto_id] = 0
        }
        sessionDurations[session.assunto_id] += session.duration_seconds
      })
    }
  }

  // Sobrescreve o duration_minutes baseando-se no tempo real armazenado via Timer
  const assuntosComTempoHistorico = assuntos?.map(a => {
    const totalSeconds = sessionDurations[a.id] || 0
    return {
      ...a,
      duration_minutes: Math.floor(totalSeconds / 60)
    }
  }) || []

  return { topicos: topicos || [], assuntos: assuntosComTempoHistorico }
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

export async function updateTopico(topicoId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('topicos')
    .update({ name })
    .eq('id', topicoId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/materias/[materia]', 'page')
  return { topico: data }
}

export async function deleteTopico(topicoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Exclui os assuntos vinculados primeiro para evitar conflitos de Foreign Key (caso não haja CASCADE no banco)
  await supabase
    .from('assuntos')
    .delete()
    .eq('topico_id', topicoId)
    .eq('user_id', user.id)

  const { error } = await supabase
    .from('topicos')
    .delete()
    .eq('id', topicoId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/materias/[materia]', 'page')
  return { success: true }
}

export async function createAssunto(topicoId: string, name: string, durationMinutes: number = 0) {
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