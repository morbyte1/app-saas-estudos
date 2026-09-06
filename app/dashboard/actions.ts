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
  
  const today = new Date()
  const currentYearStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
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
    { data: erros }
  ] = await Promise.all([
    supabase.from('study_sessions').select('id, session_date, duration_seconds, materia_id, assunto_id, questions_total, questions_wrong').eq('user_id', user.id).gte('session_date', currentYearStart),
    supabase.from('materias').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('exam_goals').select('*').eq('user_id', user.id).gte('target_date', new Date().toISOString()).order('target_date', { ascending: true }).limit(1),
    supabase.from('user_settings').select('daily_goal_hours').eq('user_id', user.id).maybeSingle(),
    supabase.from('caderno_erros').select('materia_id, assunto_id, erros_recorrentes_count, status').eq('user_id', user.id)
  ])

  const examGoal = examGoals && examGoals.length > 0 ? examGoals[0] : null
  const dailyGoalHours = userSettings?.daily_goal_hours || 3

  let totalSeconds = 0
  let todaySeconds = 0
  let totalQuestions = 0
  let totalQuestionsWrong = 0
  
  let recentQuestions = 0
  let recentQuestionsWrong = 0
  let oldQuestions = 0
  let oldQuestionsWrong = 0

  const subjectDataMap: Record<string, {
    weeklySeconds: number,
    sessionCount: number,
    totalQuestions: number,
    totalWrong: number,
    recentQuestions: number,
    recentWrong: number,
    lastStudiedAt: string | null,
    durations: number[]
  }> = {}

  if (materias) {
    materias.forEach(m => {
      subjectDataMap[m.id] = { weeklySeconds: 0, sessionCount: 0, totalQuestions: 0, totalWrong: 0, recentQuestions: 0, recentWrong: 0, lastStudiedAt: null, durations: [] }
    })
  }

  // Analytics Engine: Fonte de Verdade
  if (sessions) {
    sessions.forEach(s => {
      const dur = s.duration_seconds || 0
      const qTotal = s.questions_total || 0
      const qWrong = s.questions_wrong || 0
      
      totalSeconds += dur
      
      if (qTotal > 0) {
        totalQuestions += qTotal
        totalQuestionsWrong += qWrong
      }

      if (s.session_date) {
        if (s.session_date === todayStr) todaySeconds += dur
        
        if (s.session_date >= startOfWeekStr && qTotal > 0) {
          recentQuestions += qTotal
          recentQuestionsWrong += qWrong
        } else if (s.session_date >= lastWeekStartStr && s.session_date < startOfWeekStr && qTotal > 0) {
          oldQuestions += qTotal
          oldQuestionsWrong += qWrong
        }

        if (s.materia_id && subjectDataMap[s.materia_id]) {
          const sData = subjectDataMap[s.materia_id]
          sData.sessionCount += 1
          sData.durations.push(dur)

          if (s.session_date >= startOfWeekStr) {
            sData.weeklySeconds += dur
          }

          if (qTotal > 0) {
            sData.totalQuestions += qTotal
            sData.totalWrong += qWrong
            
            // Recência de precisão (últimos 14 dias para ter volume)
            const fortnightAgo = new Date(today);
            fortnightAgo.setDate(today.getDate() - 14);
            const fortnightStr = `${fortnightAgo.getFullYear()}-${String(fortnightAgo.getMonth() + 1).padStart(2, '0')}-${String(fortnightAgo.getDate()).padStart(2, '0')}`;
            
            if (s.session_date >= fortnightStr) {
              sData.recentQuestions += qTotal
              sData.recentWrong += qWrong
            }
          }

          if (!sData.lastStudiedAt || s.session_date > sData.lastStudiedAt) {
            sData.lastStudiedAt = s.session_date
          }
        }
      }
    })
  }

  // Precisão Global Baseada Apenas em Sessões com Questões
  const globalAccuracy = totalQuestions > 0 ? Math.round(((totalQuestions - totalQuestionsWrong) / totalQuestions) * 100) : 0
  const recentAcc = recentQuestions > 0 ? ((recentQuestions - recentQuestionsWrong) / recentQuestions) * 100 : globalAccuracy
  const oldAcc = oldQuestions > 0 ? ((oldQuestions - oldQuestionsWrong) / oldQuestions) * 100 : globalAccuracy
  const accuracyChange = Math.round(recentAcc - oldAcc)

  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMinutesRemaining = Math.floor((totalSeconds % 3600) / 60)
  const totalDurationFormatted = totalHours > 0 ? `${totalHours}h ${totalMinutesRemaining}min` : `${totalMinutesRemaining}min`

  const processedSubjects = (materias || []).map(m => {
    const sData = subjectDataMap[m.id]
    const weeklyStudiedHours = sData.weeklySeconds / 3600
    const goalHours = m.goal_hours || 1
    const goalProgress = Math.min(Math.round((weeklyStudiedHours / goalHours) * 100), 100)
    
    const accuracy = sData.totalQuestions > 0 ? Math.round(((sData.totalQuestions - sData.totalWrong) / sData.totalQuestions) * 100) : null
    const recentAccuracy = sData.recentQuestions > 0 ? Math.round(((sData.recentQuestions - sData.recentWrong) / sData.recentQuestions) * 100) : accuracy

    let paceStatus: 'acima_do_ritmo' | 'no_ritmo' | 'abaixo_do_ritmo' | 'atrasado' | 'sem_dados' = 'no_ritmo'
    const paceDifference = goalProgress - expectedProgress

    if (!sData.lastStudiedAt) {
      paceStatus = 'sem_dados'
    } else if (sData.weeklySeconds === 0) {
      if (expectedProgress < 45) paceStatus = 'no_ritmo'
      else if (expectedProgress < 75) paceStatus = 'abaixo_do_ritmo'
      else paceStatus = 'atrasado'
    } else {
      if (paceDifference >= 10) paceStatus = 'acima_do_ritmo'
      else if (paceDifference >= -15) paceStatus = 'no_ritmo'
      else if (paceDifference >= -35) paceStatus = 'abaixo_do_ritmo'
      else paceStatus = 'atrasado'
    }

    // Calcula mediana de duração das sessões
    const sortedDurations = [...sData.durations].sort((a, b) => a - b)
    const medianDurationSeconds = sortedDurations.length > 0 
      ? sortedDurations[Math.floor(sortedDurations.length / 2)] 
      : (30 * 60) // Fallback para novo usuário = 30 min

    return {
      id: m.id,
      name: m.name,
      weeklyGoal: goalHours,
      weeklyStudied: sData.weeklySeconds,
      goalProgress,
      expectedProgress,
      questions: sData.totalQuestions,
      accuracy,
      recentAccuracy,
      lastStudiedAt: sData.lastStudiedAt,
      paceStatus,
      sessionCount: sData.sessionCount,
      medianDurationMinutes: Math.round(medianDurationSeconds / 60)
    }
  })

  // Agregação de Erros
  const errorsBySubject: Record<string, number> = {}
  if (erros) {
    erros.forEach(e => {
      if (e.erros_recorrentes_count > 0 && e.materia_id) {
        errorsBySubject[e.materia_id] = (errorsBySubject[e.materia_id] || 0) + e.erros_recorrentes_count
      }
    })
  }

  // ----------------------------------------------------
  // DETERMINISTIC RECOMMENDATION ENGINE
  // ----------------------------------------------------
  let bestPriorityScore = -1
  let recommendation = null
  let diagnostics: any[] = []

  processedSubjects.forEach(sub => {
    let score = 0
    let reasons: string[] = []
    let diagnosticAdded = false

    // 1. Erros Recorrentes (Forte indício de lacuna)
    const errCount = errorsBySubject[sub.id] || 0
    if (errCount >= 3) {
      score += 40 + errCount
      reasons.push(`Você tem ${errCount} erros recorrentes para corrigir.`)
      diagnostics.push({ type: 'erros', subjectName: sub.name, message: `Revisão urgente: ${errCount} erros acumulados.` })
      diagnosticAdded = true
    }

    // 2. Precisão Significativamente Baixa (apenas se houver volume)
    if (sub.questions > 15 && sub.recentAccuracy !== null && sub.recentAccuracy < 65) {
      score += 30
      reasons.push(`Seu aproveitamento recente em ${sub.name} está abaixo do esperado (${sub.recentAccuracy}%).`)
      if (!diagnosticAdded) diagnostics.push({ type: 'precisao', subjectName: sub.name, message: `Aproveitamento recente em ${sub.recentAccuracy}%. Foco em correção.` })
    }

    // 3. Matéria Abaixo do Ritmo
    if (sub.paceStatus === 'atrasado') {
      score += 25
      reasons.push(`Você está consideravelmente atrasado na sua meta de ${sub.weeklyGoal}h semanais.`)
      if (!diagnosticAdded) diagnostics.push({ type: 'meta', subjectName: sub.name, message: `Déficit crítico no ritmo planejado da semana.` })
    } else if (sub.paceStatus === 'abaixo_do_ritmo') {
      score += 15
      reasons.push(`Aumentar o tempo agora ajuda a não acumular déficit na semana.`)
    }

    // 4. Continuidade / Negligência
    if (sub.lastStudiedAt) {
      const diffDays = Math.floor((today.getTime() - new Date(sub.lastStudiedAt).getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 7) {
        score += 20
        reasons.push(`Faz ${diffDays} dias que você não revisita esta matéria.`)
      } else if (diffDays === 0) {
        // Acabou de estudar, bônus leve de continuidade
        score += 5
      }
    } else {
      // Usuário novo ou matéria nova
      score += 10
      reasons.push('Faça seu primeiro estudo para o Revyza começar a entender seu ritmo.')
    }

    // Decisão
    if (score > bestPriorityScore || bestPriorityScore === -1) {
      bestPriorityScore = score
      
      const isNew = sub.sessionCount === 0
      const recommendedDuration = isNew ? 30 : sub.medianDurationMinutes
      
      recommendation = {
        materiaId: sub.id,
        subject: sub.name,
        topic: errCount > 0 ? 'Foco em Correção' : (isNew ? 'Primeiro Estudo' : 'Avançar na Trilha'),
        duration: recommendedDuration,
        questions: isNew ? 0 : 15,
        accuracy: sub.recentAccuracy || 0,
        reason: reasons.length > 0 ? reasons.join(' ') : 'Você está com um ritmo consistente. Continue avançando no conteúdo.',
        action: errCount > 0 ? 'Revisar agora' : 'Começar estudo',
        actionUrl: `/dashboard/timer?materiaId=${sub.id}`
      }
    }
  })

  // Fallback caso não haja matérias
  if (!recommendation && processedSubjects.length === 0) {
    recommendation = {
      materiaId: null,
      subject: 'Nenhuma matéria',
      topic: 'Configuração',
      duration: 0,
      questions: 0,
      accuracy: 0,
      reason: 'Adicione suas matérias no painel para receber recomendações personalizadas.',
      action: 'Adicionar Matérias',
      actionUrl: '/dashboard/materias'
    }
  }

  // Ordena os diagnósticos gerados pelo motor
  diagnostics = diagnostics.slice(0, 3)

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
      diagnostics, 
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