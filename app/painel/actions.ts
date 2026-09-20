'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { dataBrasil, type AssuntoDesempenho, type SessaoDesempenho } from '@/lib/desempenho'
import { buildDashboard, type DashboardEvento, type DashboardMateria } from '@/lib/dashboard'
import type { CadernoErro } from '@/lib/caderno'

export async function saveStudySession(duration_seconds: number) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'User not authenticated' }
  }

  const { error } = await supabase.from('study_sessions').insert({
    user_id: user.id,
    duration_seconds,
    created_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
  revalidatePath('/painel')
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
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) return { error: 'User not authenticated', tasks: [] }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, tasks: [] }
  return { tasks: tasks || [] }
}

export async function createTask(data: {
  title: string
  materia_id?: string | null
  tag_padrao?: string | null
  priority: 'baixa' | 'normal' | 'alta'
}) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) return { error: 'User not authenticated' }

  const { data: newTask, error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title: data.title,
    materia_id: data.materia_id || null,
    tag_padrao: data.tag_padrao || null,
    priority: data.priority,
    is_done: false,
  }).select().single()

  if (error) return { error: error.message }
  revalidatePath('/painel')
  return { success: true, task: newTask }
}

export async function updateTask(id: string, data: {
  title?: string
  materia_id?: string | null
  tag_padrao?: string | null
  priority?: 'baixa' | 'normal' | 'alta'
}) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'User not authenticated' }

  const { data: updatedTask, error } = await supabase
    .from('tasks')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/painel')
  return { success: true, task: updatedTask }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'User not authenticated' }

  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/painel')
  return { success: true }
}

export async function toggleTaskStatus(id: string, is_done: boolean) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'User not authenticated' }

  const { error } = await supabase.from('tasks').update({ is_done }).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/painel')
  return { success: true }
}

// ==========================================
// AÇÕES DO DASHBOARD (ESTATÍSTICAS E INTELIGÊNCIA)
// ==========================================

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { success: false, error: 'Usuário não autenticado', data: null }

  const now = new Date()
  const today = dataBrasil(now)
  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(now)
  const pageSize = 1000
  const loadSessions = async () => {
    const rows: SessaoDesempenho[] = []
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase.from('study_sessions')
        .select('session_date, created_at, duration_seconds, questions_total, questions_done, questions_wrong, materia_id, assunto_id')
        .eq('user_id', user.id).order('created_at').order('id').range(offset, offset + pageSize - 1)
      if (error) return { error: error.message, rows }
      rows.push(...(data || []))
      if (!data || data.length < pageSize) break
    }
    return { error: null, rows }
  }
  const loadErrors = async () => {
    const rows: CadernoErro[] = []
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase.from('caderno_erros')
        .select('*, assuntos(name)').eq('user_id', user.id).is('deleted_at', null)
        .order('created_at').order('id').range(offset, offset + pageSize - 1)
      if (error) return { error: error.message, rows }
      rows.push(...((data || []).map(e => ({ ...e, assuntos: Array.isArray(e.assuntos) ? e.assuntos[0] || null : e.assuntos })) as CadernoErro[]))
      if (!data || data.length < pageSize) break
    }
    return { error: null, rows }
  }
  const loadTopics = async () => {
    const rows: AssuntoDesempenho[] = []
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase.from('assuntos').select('id, name, topicos(materia_id)')
        .eq('user_id', user.id).order('id').range(offset, offset + pageSize - 1)
      if (error) return { error: error.message, rows }
      rows.push(...(data || []).map(a => ({ id: a.id, name: a.name,
        materia_id: a.topicos?.[0]?.materia_id || ''
      })).filter(a => !!a.materia_id))
      if (!data || data.length < pageSize) break
    }
    return { error: null, rows }
  }

  const [sessions, errors, topics, materias, events, plan, dailyGoal, examGoal] = await Promise.all([
    loadSessions(), loadErrors(), loadTopics(),
    supabase.from('materias').select('id, name, goal_hours, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('schedule_events').select('id, title, event_date, time, duration, subject_id, activity_type, is_done')
      .eq('user_id', user.id).eq('event_date', today).order('time'),
    supabase.from('user_plan_settings').select('horas_dias_semana, horas_sabado, horas_domingo').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_settings').select('daily_goal_hours').eq('user_id', user.id).maybeSingle(),
    supabase.from('exam_goals').select('name, target_date').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
  ])
  const error = sessions.error || errors.error || topics.error || materias.error?.message || events.error?.message
    || plan.error?.message || dailyGoal.error?.message || examGoal.error?.message
  if (error) return { success: false, error, data: null }

  const dashboard = buildDashboard({
    today, time, sessions: sessions.rows, erros: errors.rows, assuntos: topics.rows,
    materias: (materias.data || []) as DashboardMateria[], events: (events.data || []) as DashboardEvento[],
    plan: plan.data, dailyGoal: dailyGoal.data?.daily_goal_hours ?? null,
    examGoal: examGoal.data?.[0] || null,
  })
  return { success: true, data: { userName: user.user_metadata?.full_name || 'Estudante', ...dashboard } }
}

export async function updateExamGoal(id: string, data: { name: string, target_date: string }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'User not authenticated' }

  const { data: updatedGoal, error } = await supabase.from('exam_goals').update({
    name: data.name,
    target_date: data.target_date,
  }).eq('id', id).eq('user_id', user.id).select().single()

  if (error) return { error: error.message }
  revalidatePath('/painel')
  return { success: true, goal: updatedGoal }
}

export async function deleteExamGoal(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'User not authenticated' }

  const { error } = await supabase.from('exam_goals').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/painel')
  return { success: true }
}

export async function updateDailyGoal(hours: number) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'User not authenticated' }

  const { error } = await supabase.from('user_settings').upsert({
    user_id: user.id,
    daily_goal_hours: hours,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/painel')
  revalidatePath('/painel/calendario')
  return { success: true }
}
