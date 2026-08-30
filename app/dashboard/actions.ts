'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveStudySession(duration_seconds: number) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

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

  const { data: { user }, error: userError } = await supabase.auth.getUser()

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
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) return { error: 'User not authenticated' }

  const { data: newTask, error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title: data.title,
    subject_id: data.subject_id,
    priority: data.priority,
    is_done: false,
  }).select().single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true, task: newTask }
}

export async function updateTask(id: string, data: {
  title?: string
  subject_id?: string
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

  revalidatePath('/dashboard')
  return { success: true, task: updatedTask }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) return { error: 'User not authenticated' }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleTaskStatus(id: string, is_done: boolean) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) return { error: 'User not authenticated' }

  const { error } = await supabase
    .from('tasks')
    .update({ is_done })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// ==========================================
// AÇÕES DO DASHBOARD (ESTATÍSTICAS E METAS)
// ==========================================

export async function getDashboardStats() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return {
      success: false,
      error: 'Usuário não autenticado',
      data: null
    }
  }

  const userName = user.user_metadata?.full_name || 'Estudante'

  const [
    { data: sessions },
    { data: materias },
    { data: examGoals },
    { data: userSettings }
  ] = await Promise.all([
    supabase
      .from('study_sessions')
      .select('session_date, duration_seconds, materia_id')
      .eq('user_id', user.id),
    supabase
      .from('materias')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('exam_goals')
      .select('*')
      .eq('user_id', user.id)
      .gte('target_date', new Date().toISOString())
      .order('target_date', { ascending: true })
      .limit(1),
    supabase
      .from('user_settings')
      .select('daily_goal_hours')
      .eq('user_id', user.id)
      .maybeSingle()
  ])

  const examGoal = examGoals && examGoals.length > 0 ? examGoals[0] : null
  const dailyGoalHours = userSettings?.daily_goal_hours || 3

  let totalSeconds = 0
  let todaySeconds = 0
  const sessionDates = new Set<string>()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`

  const subjectWeeklyDuration: Record<string, number> = {}

  if (sessions) {
    sessions.forEach(s => {
      const dur = s.duration_seconds || 0
      totalSeconds += dur
      
      if (s.session_date) {
        sessionDates.add(s.session_date)
        if (s.session_date === todayStr) {
          todaySeconds += dur
        }
        if (s.session_date >= startOfWeekStr && s.materia_id) {
          subjectWeeklyDuration[s.materia_id] = (subjectWeeklyDuration[s.materia_id] || 0) + dur
        }
      }
    })
  }

  // Lógica de Sequência (Streak)
  const uniqueDates = Array.from(sessionDates).sort().reverse()
  let currentStreak = 0
  let maxStreak = 0
  
  const parseDate = (dStr: string) => {
    const [y, m, d] = dStr.split('-')
    return new Date(Number(y), Number(m) - 1, Number(d))
  }

  if (uniqueDates.length > 0) {
    let tempStreak = 1
    maxStreak = 1
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const diffDays = Math.round((parseDate(uniqueDates[i]).getTime() - parseDate(uniqueDates[i+1]).getTime()) / 86400000)
      if (diffDays === 1) {
        tempStreak++
        if (tempStreak > maxStreak) maxStreak = tempStreak
      } else {
        tempStreak = 1
      }
    }
  }

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

  if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
    currentStreak = 1
    let i = 0
    while (i < uniqueDates.length - 1) {
      const diffDays = Math.round((parseDate(uniqueDates[i]).getTime() - parseDate(uniqueDates[i+1]).getTime()) / 86400000)
      if (diffDays === 1) {
        currentStreak++
        i++
      } else {
        break
      }
    }
  }

  let topSubjects: any[] = []
  if (materias) {
    topSubjects = materias.map(m => {
      const weeklySecs = subjectWeeklyDuration[m.id] || 0
      const studiedHours = Math.floor(weeklySecs / 3600)
      const studiedMinutes = Math.floor((weeklySecs % 3600) / 60)
      const goalHours = m.goal_hours || 1
      const progress = Math.min(Math.round(((weeklySecs / 3600) / goalHours) * 100), 100)

      return {
        id: m.id,
        name: m.name,
        goalHours: m.goal_hours || 1,
        studiedHours,
        studiedMinutes,
        progress
      }
    }).slice(0, 3)
  }

  const todayMinutes = Math.floor(todaySeconds / 60)
  
  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMinutesRemaining = Math.floor((totalSeconds % 3600) / 60)
  const totalDurationFormatted = totalHours > 0 
    ? `${totalHours}h ${totalMinutesRemaining}min` 
    : `${totalMinutesRemaining}min`

  return {
    success: true,
    data: {
      userName,
      todayMinutes,
      totalHours,
      totalDurationFormatted,
      currentStreak,
      maxStreak,
      examGoal: examGoal || null,
      topSubjects: topSubjects || [],
      dailyGoalHours
    }
  }
}

export async function createExamGoal(data: { name: string, target_date: string }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'User not authenticated' }

  const { data: newGoal, error } = await supabase.from('exam_goals').insert({
    user_id: user.id,
    name: data.name,
    target_date: data.target_date,
  }).select().single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true, goal: newGoal }
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
  revalidatePath('/dashboard')
  return { success: true, goal: updatedGoal }
}

export async function deleteExamGoal(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'User not authenticated' }

  const { error } = await supabase.from('exam_goals').delete().eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
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
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/calendario')
  return { success: true }
}