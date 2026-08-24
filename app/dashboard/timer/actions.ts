'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveTimerSession(data: {
  materia_id: string
  assunto_id: string
  duration_seconds: number
  questions_done: number
  questions_wrong: number
  session_date: string
}) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Erro de autenticação:', userError?.message)
    return { error: 'Usuário não autenticado' }
  }

  const { error } = await supabase.from('study_sessions').insert({
    user_id: user.id,
    materia_id: data.materia_id,
    assunto_id: data.assunto_id,
    duration_seconds: data.duration_seconds,
    questions_done: data.questions_done,
    questions_wrong: data.questions_wrong,
    session_date: data.session_date,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Erro ao salvar sessão no timer:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/timer')
  return { success: true }
}

export async function getTimerHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Usuário não autenticado', data: [] }
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .select(`
      id,
      duration_seconds,
      questions_done,
      questions_wrong,
      session_date,
      materia_id,
      assunto_id,
      materias ( name ),
      assuntos ( name )
    `)
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar histórico do timer:', error.message)
    return { error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function deleteTimerSession(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Usuário não autenticado' }
  }

  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Erro ao excluir sessão do timer:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/timer')
  return { success: true }
}