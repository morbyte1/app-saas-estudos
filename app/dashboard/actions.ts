'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveStudySession(duration_seconds: number) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError?.message)
    return { error: 'User not authenticated' }
  }

  const { error } = await supabase.from('study_sessions').insert({
    user_id: user.id,
    duration_seconds,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Error saving study session:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ==========================================
// AÇÕES DA LISTA DE TAREFAS (TASKS)
// ==========================================

export async function getTasks() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError?.message)
    return { error: 'User not authenticated', tasks: [] }
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tasks:', error.message)
    return { error: error.message, tasks: [] }
  }

  return { tasks: tasks || [] }
}

export async function createTask(data: {
  title: string
  subject_id: string
  priority: 'baixa' | 'normal' | 'alta'
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'User not authenticated' }
  }

  const { data: newTask, error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title: data.title,
    subject_id: data.subject_id,
    priority: data.priority,
    is_done: false,
  }).select().single()

  if (error) {
    console.error('Error creating task:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true, task: newTask }
}

export async function updateTask(id: string, data: {
  title?: string
  subject_id?: string
  priority?: 'baixa' | 'normal' | 'alta'
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'User not authenticated' }
  }

  const { data: updatedTask, error } = await supabase
    .from('tasks')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating task:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true, task: updatedTask }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting task:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleTaskStatus(id: string, is_done: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('tasks')
    .update({ is_done })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error toggling task status:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}