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
  lastStudiedDate: string | null
  accuracy: number | null
  topicCount: number
  status: 'Não iniciada' | 'No ritmo' | 'Atenção' | 'Meta alcançada'
}

export type EnemAssunto = string;
export type EnemTopico = { name: string; assuntos: EnemAssunto[] };
export type EnemMateria = { name: string; default_goal_ratio: number; topicos: EnemTopico[] };
export type EnemData = { vestibular: string; exam_target: { name: string; target_date: string }; materias: EnemMateria[] };

const getStartOfWeekString = () => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) 
  return `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`
}

export async function getEstatisticas() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Usuário não autenticado' }

  const [materiasRes, userSettingsRes, examGoalsRes] = await Promise.all([
    supabase.from('materias').select('id, goal_hours').eq('user_id', user.id),
    supabase.from('user_settings').select('daily_goal_hours').eq('user_id', user.id).maybeSingle(),
    supabase.from('exam_goals').select('name').eq('user_id', user.id).gte('target_date', new Date().toISOString()).order('target_date', { ascending: true }).limit(1)
  ])

  const materias = materiasRes.data
  const dailyGoalHours = userSettingsRes.data?.daily_goal_hours || 3
  const examGoalName = examGoalsRes.data && examGoalsRes.data.length > 0 ? examGoalsRes.data[0].name : null

  if (materiasRes.error || !materias || materias.length === 0) {
    return {
      success: true,
      data: { totalFocus: "0h 0min", progress: "0%", activeSubjects: 0, dailyGoalHours, examGoalName }
    }
  }

  const startOfWeekStr = getStartOfWeekString()
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('materia_id, duration_seconds')
    .eq('user_id', user.id)
    .gte('session_date', startOfWeekStr)

  let totalSeconds = 0
  const progressPorMateria = new Map<string, { duration: number, goal: number }>()

  materias.forEach(m => progressPorMateria.set(m.id, { duration: 0, goal: m.goal_hours || 0 }))

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
      totalProgress += Math.min((studiedHours / val.goal) * 100, 100)
    }
  })

  const totalHours = Math.floor(totalSeconds / 3600)
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60)
  const averageProgress = materias.length > 0 ? (totalProgress / materias.length).toFixed(1) : 0

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

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Usuário não autenticado' }

  // Busca paralela para cruzamento de dados real e confiável
  const [materiasRes, sessionsRes, topicosRes] = await Promise.all([
    supabase.from('materias').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('study_sessions').select('materia_id, duration_seconds, questions_total, questions_wrong, session_date').eq('user_id', user.id),
    supabase.from('topicos').select('id, materia_id').eq('user_id', user.id)
  ])

  if (materiasRes.error) return { error: materiasRes.error.message }

  const materias = materiasRes.data || []
  const sessions = sessionsRes.data || []
  const topicos = topicosRes.data || []
  const startOfWeekStr = getStartOfWeekString()
  const today = new Date().getTime()

  const formattedMaterias: Materia[] = materias.map(m => {
    const mSessions = sessions.filter(s => s.materia_id === m.id)
    const mTopicos = topicos.filter(t => t.materia_id === m.id)
    
    let weeklySeconds = 0
    let totalQ = 0
    let wrongQ = 0
    let lastStudiedDate: string | null = null

    mSessions.forEach(s => {
      // Duração da semana
      if (s.session_date >= startOfWeekStr) {
        weeklySeconds += (s.duration_seconds || 0)
      }
      // Questões (Todo o período para precisão)
      if (s.questions_total && s.questions_total > 0) {
        totalQ += s.questions_total
        wrongQ += (s.questions_wrong || 0)
      }
      // Último dia de estudo
      if (!lastStudiedDate || s.session_date > lastStudiedDate) {
        lastStudiedDate = s.session_date
      }
    })

    const studiedHours = Math.floor(weeklySeconds / 3600)
    const studiedMinutes = Math.floor((weeklySeconds % 3600) / 60)
    const goalHours = m.goal_hours || 1
    const progress = Math.min(Math.round(((weeklySeconds / 3600) / goalHours) * 100), 100)
    const accuracy = totalQ > 0 ? Math.round(((totalQ - wrongQ) / totalQ) * 100) : null

    // Cálculo do Estado da Matéria
    let status: Materia['status'] = 'No ritmo'
    if (mSessions.length === 0) {
      status = 'Não iniciada'
    } else if (progress >= 100) {
      status = 'Meta alcançada'
    } else if (lastStudiedDate) {
      const daysSince = Math.floor((today - new Date(lastStudiedDate + 'T12:00:00Z').getTime()) / (1000 * 3600 * 24))
      if (daysSince > 4 && progress < 100) {
        status = 'Atenção'
      }
    }

    return {
      id: m.id,
      name: m.name,
      goalHours,
      studiedHours,
      studiedMinutes,
      progress,
      lastStudiedDate,
      accuracy,
      topicCount: mTopicos.length,
      status
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
    if (!fs.existsSync(filePath)) return { error: 'Arquivo de trilha não encontrado no servidor.' }
    
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const enemData: EnemData = JSON.parse(fileContents)
    const weeklyHours = dailyHours * 7

    const payload = enemData.materias.map(m => ({
      name: m.name,
      goal_hours: Math.max(1, Math.round(weeklyHours * m.default_goal_ratio)),
      topicos: m.topicos
    }))

    const { error: rpcError } = await supabase.rpc('import_enem_data', { p_user_id: user.id, p_materias: payload })
    if (rpcError) throw rpcError

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/materias')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function createMateria(data: { name: string, goalHours: number }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase.from('materias').insert({
    user_id: user.id,
    name: data.name,
    goal_hours: data.goalHours,
    studied_hours: 0,
    studied_minutes: 0,
    progress: 0
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/materias')
  return { success: true }
}

export async function updateMateria(id: string, data: { name: string, goalHours: number }) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase.from('materias').update({ name: data.name, goal_hours: data.goalHours })
    .eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/materias')
  return { success: true }
}

export async function deleteMateria(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase.from('materias').delete().eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/materias')
  return { success: true }
}