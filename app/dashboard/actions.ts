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

  revalidatePath('/dashboard')
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
// AÇÕES DO DASHBOARD (ESTATÍSTICAS E INTELIGÊNCIA)
// ==========================================

export async function getDashboardStats() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Usuário não autenticado', data: null }
  }

  const userName = user.user_metadata?.full_name || 'Estudante'
  
  // Datas base
  const today = new Date()
  const currentYearStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  // Definição consistente de semana: Segunda = 1, Domingo = 7
  const dayOfWeekJS = today.getDay()
  const currentDayOfWeek = dayOfWeekJS === 0 ? 7 : dayOfWeekJS 
  const expectedProgress = Math.min(Math.round((currentDayOfWeek / 7) * 100), 100)
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - (currentDayOfWeek - 1))
  const startOfWeekStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`

  const lastWeekStart = new Date(startOfWeek)
  lastWeekStart.setDate(startOfWeek.getDate() - 7)
  const lastWeekStartStr = `${lastWeekStart.getFullYear()}-${String(lastWeekStart.getMonth() + 1).padStart(2, '0')}-${String(lastWeekStart.getDate()).padStart(2, '0')}`

  const [
    { data: sessions },
    { data: materias },
    { data: examGoals },
    { data: userSettings },
    { data: erros },
    { data: topicos }
  ] = await Promise.all([
    supabase.from('study_sessions').select('session_date, duration_seconds, materia_id, questions_done, questions_wrong').eq('user_id', user.id).gte('session_date', currentYearStart),
    supabase.from('materias').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('exam_goals').select('*').eq('user_id', user.id).gte('target_date', new Date().toISOString()).order('target_date', { ascending: true }).limit(1),
    supabase.from('user_settings').select('daily_goal_hours').eq('user_id', user.id).maybeSingle(),
    supabase.from('caderno_erros').select('materia_id, assunto_id, erros_recorrentes_count, status').eq('user_id', user.id),
    supabase.from('topicos').select('id, name').eq('user_id', user.id)
  ])

  const examGoal = examGoals && examGoals.length > 0 ? examGoals[0] : null
  const dailyGoalHours = userSettings?.daily_goal_hours || 3

  // Variáveis Globais
  let totalSeconds = 0
  let todaySeconds = 0
  let totalQuestionsDone = 0
  let totalQuestionsWrong = 0
  
  let recentQuestionsDone = 0
  let recentQuestionsWrong = 0
  let oldQuestionsDone = 0
  let oldQuestionsWrong = 0

  const subjectDataMap: Record<string, {
    weeklySeconds: number,
    totalQuestions: number,
    totalDone: number,
    totalWrong: number,
    lastStudiedAt: string | null
  }> = {}

  if (materias) {
    materias.forEach(m => {
      subjectDataMap[m.id] = { weeklySeconds: 0, totalQuestions: 0, totalDone: 0, totalWrong: 0, lastStudiedAt: null }
    })
  }

  // Processamento das Sessões
  if (sessions) {
    sessions.forEach(s => {
      const dur = s.duration_seconds || 0
      const qDone = s.questions_done || 0
      const qWrong = s.questions_wrong || 0
      const qTotal = qDone + qWrong
      
      totalSeconds += dur
      totalQuestionsDone += qDone
      totalQuestionsWrong += qWrong

      if (s.session_date) {
        if (s.session_date === todayStr) todaySeconds += dur
        
        // Variação de precisão (Últimos 7 dias vs 7 dias anteriores)
        if (s.session_date >= startOfWeekStr) {
          recentQuestionsDone += qDone
          recentQuestionsWrong += qWrong
        } else if (s.session_date >= lastWeekStartStr && s.session_date < startOfWeekStr) {
          oldQuestionsDone += qDone
          oldQuestionsWrong += qWrong
        }

        // Dados por Matéria
        if (s.materia_id && subjectDataMap[s.materia_id]) {
          if (s.session_date >= startOfWeekStr) {
            subjectDataMap[s.materia_id].weeklySeconds += dur
          }
          subjectDataMap[s.materia_id].totalDone += qDone
          subjectDataMap[s.materia_id].totalWrong += qWrong
          subjectDataMap[s.materia_id].totalQuestions += qTotal

          const currentLastStr = subjectDataMap[s.materia_id].lastStudiedAt
          if (!currentLastStr || s.session_date > currentLastStr) {
            subjectDataMap[s.materia_id].lastStudiedAt = s.session_date
          }
        }
      }
    })
  }

  // Precisão Global
  const totalQuestions = totalQuestionsDone + totalQuestionsWrong
  const globalAccuracy = totalQuestions > 0 ? Math.round((totalQuestionsDone / totalQuestions) * 100) : 0

  const recentTotal = recentQuestionsDone + recentQuestionsWrong
  const recentAcc = recentTotal > 0 ? (recentQuestionsDone / recentTotal) * 100 : globalAccuracy
  const oldTotal = oldQuestionsDone + oldQuestionsWrong
  const oldAcc = oldTotal > 0 ? (oldQuestionsDone / oldTotal) * 100 : globalAccuracy
  const accuracyChange = Math.round(recentAcc - oldAcc)

  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMinutesRemaining = Math.floor((totalSeconds % 3600) / 60)
  const totalDurationFormatted = totalHours > 0 ? `${totalHours}h ${totalMinutesRemaining}min` : `${totalMinutesRemaining}min`

  // Construção dos Objetos de Matérias
  const processedSubjects = (materias || []).map(m => {
    const sData = subjectDataMap[m.id]
    const weeklyStudiedHours = sData.weeklySeconds / 3600
    const goalHours = m.goal_hours || 1
    const goalProgress = Math.min(Math.round((weeklyStudiedHours / goalHours) * 100), 100)
    const accuracy = sData.totalQuestions > 0 ? Math.round((sData.totalDone / sData.totalQuestions) * 100) : 0

    let paceStatus: 'acima_do_ritmo' | 'no_ritmo' | 'abaixo_do_ritmo' | 'atrasado' | 'sem_dados' = 'no_ritmo'
    const paceDifference = goalProgress - expectedProgress

    if (!sData.lastStudiedAt) {
      paceStatus = 'sem_dados'
    } else if (sData.weeklySeconds === 0) {
      // Se possui histórico mas ainda não estudou na semana
      if (expectedProgress < 45) {
        // Até quarta-feira (43%), ausência de estudo ainda é tolerada como neutra
        paceStatus = 'no_ritmo'
      } else if (expectedProgress < 75) {
        // A partir de quinta, começa a atrasar levemente
        paceStatus = 'abaixo_do_ritmo'
      } else {
        // Chegou ao final da semana sem fazer nada, definitivamente atrasado
        paceStatus = 'atrasado'
      }
    } else {
      if (paceDifference >= 10) paceStatus = 'acima_do_ritmo'
      else if (paceDifference >= -15) paceStatus = 'no_ritmo'
      else if (paceDifference >= -35) paceStatus = 'abaixo_do_ritmo'
      else paceStatus = 'atrasado'
    }

    return {
      id: m.id,
      name: m.name,
      weeklyGoal: goalHours,
      weeklyStudied: sData.weeklySeconds,
      goalProgress,
      expectedProgress,
      questions: sData.totalQuestions,
      accuracy,
      lastStudiedAt: sData.lastStudiedAt,
      paceStatus
    }
  })

  // Diagnósticos
  const diagnostics: any[] = []

  processedSubjects.forEach(sub => {
    if (sub.paceStatus === 'atrasado') {
      diagnostics.push({ type: 'meta', subjectId: sub.id, subjectName: sub.name, message: `Você está consideravelmente atrasado na meta semanal desta matéria.` })
    }
    if (sub.questions > 10 && sub.accuracy < 60) {
      diagnostics.push({ type: 'precisao', subjectId: sub.id, subjectName: sub.name, message: `Precisão geral de ${sub.accuracy}%. Sugerimos uma revisão de base.` })
    }
  })

  let totalRecurrentErrors = 0
  const errorsBySubject: Record<string, number> = {}
  
  if (erros) {
    erros.forEach(e => {
      if (e.erros_recorrentes_count > 0) {
        totalRecurrentErrors += e.erros_recorrentes_count
        if (e.materia_id) {
          errorsBySubject[e.materia_id] = (errorsBySubject[e.materia_id] || 0) + e.erros_recorrentes_count
        }
      }
    })
  }

  Object.entries(errorsBySubject).forEach(([mId, count]) => {
    if (count >= 3) {
      const matName = materias?.find(m => m.id === mId)?.name || 'Matéria'
      diagnostics.push({ type: 'erros', subjectId: mId, subjectName: matName, message: `Você acumulou ${count} erros recorrentes. Atenção aos pontos cegos.` })
    }
  })

  // Ordenar diagnósticos por gravidade
  diagnostics.sort((a, b) => {
    const order = { 'erros': 1, 'meta': 2, 'precisao': 3 }
    return (order[a.type as keyof typeof order] || 4) - (order[b.type as keyof typeof order] || 4)
  })

  // Recomendação Central Determinística
  let recommendation = null

  if (!recommendation && Object.keys(errorsBySubject).length > 0) {
    const worstSubjId = Object.keys(errorsBySubject).sort((a,b) => errorsBySubject[b] - errorsBySubject[a])[0]
    const matName = materias?.find(m => m.id === worstSubjId)?.name || 'Revisão'
    const acc = processedSubjects.find(s => s.id === worstSubjId)?.accuracy || 0
    const errorCount = errorsBySubject[worstSubjId]
    recommendation = {
      type: 'revisao',
      subject: matName,
      topic: 'Caderno de Erros',
      duration: 30,
      questions: errorCount,
      accuracy: acc,
      reason: `Você possui ${errorCount} erros recorrentes acumulados. É fundamental entender essas falhas antes de avançar no conteúdo novo.`,
      action: 'Revisar agora',
      actionUrl: '/dashboard/caderno'
    }
  }

  if (!recommendation) {
    const delayed = processedSubjects.filter(s => s.paceStatus === 'atrasado' || s.paceStatus === 'abaixo_do_ritmo').sort((a,b) => (a.goalProgress - expectedProgress) - (b.goalProgress - expectedProgress))[0]
    if (delayed) {
      recommendation = {
        type: 'meta',
        subject: delayed.name,
        topic: 'Recuperar o ritmo',
        duration: 60,
        questions: 20, 
        accuracy: delayed.accuracy,
        reason: `Você está ${delayed.paceStatus === 'atrasado' ? 'atrasado' : 'abaixo do ritmo'} na meta desta matéria. Focar nela agora ajudará a não acumular o déficit da semana.`,
        action: 'Começar estudo',
        actionUrl: '/dashboard/timer'
      }
    }
  }

  if (!recommendation) {
    const lowAcc = [...processedSubjects].filter(s => s.questions > 15 && s.accuracy < 65).sort((a,b) => a.accuracy - b.accuracy)[0]
    if (lowAcc) {
      recommendation = {
        type: 'precisao',
        subject: lowAcc.name,
        topic: 'Prática e Correção',
        duration: 45,
        questions: 15,
        accuracy: lowAcc.accuracy,
        reason: `Sua precisão nesta matéria está em ${lowAcc.accuracy}%. Aconselhamos focar em exercícios de fixação e correção ativa.`,
        action: 'Praticar agora',
        actionUrl: '/dashboard/timer'
      }
    }
  }

  if (!recommendation && processedSubjects.length > 0) {
    const candidate = [...processedSubjects].sort((a, b) => {
      if (!a.lastStudiedAt) return -1
      if (!b.lastStudiedAt) return 1
      return new Date(a.lastStudiedAt).getTime() - new Date(b.lastStudiedAt).getTime()
    })[0]

    let reason = ''
    let duration = 45
    let questions = 15
    let topic = 'Avançar na trilha'
    let action = 'Começar estudo'

    if (!candidate.lastStudiedAt) {
      reason = 'Você ainda não registrou um estudo nesta matéria. Faça seu primeiro estudo para começarmos a acompanhar sua evolução.'
      duration = 40
      questions = 10
      topic = 'Primeiro Estudo'
      action = 'Começar agora'
    } else {
      const lastDate = new Date(candidate.lastStudiedAt).getTime()
      const now = today.getTime()
      const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24))

      if (diffDays > 2) {
        reason = `Você não estuda essa matéria há ${diffDays} dias. Retome o contato com o material para manter o conteúdo fresco.`
        duration = 50
        questions = 15
        topic = 'Retomar Estudo'
      } else {
        reason = 'Você está no ritmo. Continue avançando na sua trilha de estudos focando na disciplina de maior prioridade atual.'
        duration = 45
        questions = 15
      }
    }

    recommendation = {
      type: 'geral',
      subject: candidate.name,
      topic,
      duration,
      questions,
      accuracy: candidate.accuracy,
      reason,
      action,
      actionUrl: '/dashboard/timer'
    }
  }

  let daysRemaining = 0
  if (examGoal && examGoal.target_date) {
    const target = new Date(examGoal.target_date).getTime()
    const now = today.getTime()
    if (target > now) {
      daysRemaining = Math.floor((target - now) / (1000 * 60 * 60 * 24))
    }
  }

  return {
    success: true,
    data: {
      userName,
      today: {
        minutes: Math.floor(todaySeconds / 60),
        goal: dailyGoalHours,
        progress: Math.min(Math.round(((todaySeconds / 3600) / dailyGoalHours) * 100), 100)
      },
      overall: {
        totalStudyTime: totalDurationFormatted,
        questions: totalQuestions,
        accuracy: globalAccuracy,
        accuracyChange: isNaN(accuracyChange) ? 0 : accuracyChange
      },
      exam: examGoal ? {
        id: examGoal.id,
        name: examGoal.name,
        targetDate: examGoal.target_date,
        daysRemaining
      } : null,
      subjects: processedSubjects,
      diagnostics: diagnostics.slice(0, 3), 
      recommendation
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