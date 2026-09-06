'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleTaskStatus(id: string, is_done: boolean) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'User not authenticated' }

  const { error } = await supabase.from('tasks').update({ is_done }).eq('id', id).eq('user_id', user.id)
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
  if (userError || !user) return { success: false, error: 'Usuário não autenticado', data: null }

  const userName = user.user_metadata?.full_name || 'Estudante'

  // Ajuste de Timezone (Foca no horário de Brasília - UTC-3) para cálculo de "Hoje" e períodos
  const now = new Date()
  now.setUTCHours(now.getUTCHours() - 3)
  
  const getYYYYMMDD = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  const todayStr = getYYYYMMDD(now)
  
  const currentDayOfWeek = now.getUTCDay() === 0 ? 7 : now.getUTCDay() // 1=Seg, 7=Dom
  const daysRemainingWeek = 7 - currentDayOfWeek + 1

  const [
    { data: sessionsData },
    { data: materiasData },
    { data: userSettings },
    { data: errosData }
  ] = await Promise.all([
    supabase.from('study_sessions').select('id, session_date, duration_seconds, materia_id, assunto_id, questions_total, questions_wrong').eq('user_id', user.id),
    supabase.from('materias').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('user_settings').select('daily_goal_hours').eq('user_id', user.id).maybeSingle(),
    supabase.from('caderno_erros').select('materia_id, erros_recorrentes_count').eq('user_id', user.id)
  ])

  const sessions = sessionsData || []
  const materias = materiasData || []
  const dailyGoalHours = userSettings?.daily_goal_hours || 3

  // ----------------------------------------------------
  // CALCULO DE SEQUÊNCIA (STREAK)
  // ----------------------------------------------------
  const uniqueDates = [...new Set(sessions.map(s => s.session_date))].sort().reverse()
  let currentStreak = 0
  let bestStreak = 0

  if (uniqueDates.length > 0) {
    let curr = 1
    let max = 1
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const d1 = new Date(uniqueDates[i] + 'T12:00:00Z')
      const d2 = new Date(uniqueDates[i + 1] + 'T12:00:00Z')
      const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        curr++
        max = Math.max(max, curr)
      } else {
        curr = 1
      }
    }
    bestStreak = max

    const hasToday = uniqueDates.includes(todayStr)
    const yesterday = new Date(now)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const yesterdayStr = getYYYYMMDD(yesterday)
    
    if (!hasToday && !uniqueDates.includes(yesterdayStr)) {
      currentStreak = 0
    } else {
      let streakDate = new Date(hasToday ? now : yesterday)
      currentStreak = 1
      while (true) {
        streakDate.setUTCDate(streakDate.getUTCDate() - 1)
        const checkStr = getYYYYMMDD(streakDate)
        if (uniqueDates.includes(checkStr)) currentStreak++
        else break
      }
    }
  }

  // ----------------------------------------------------
  // GERADOR DE PERÍODOS (7, 14, 30, All)
  // ----------------------------------------------------
  const calculatePeriod = (days: number | 'all') => {
    let periodSessions = []
    let prevPeriodSessions = []
    let periodTotalQuestions = 0
    let periodWrongQuestions = 0
    let prevTotalQuestions = 0
    let prevWrongQuestions = 0
    let periodDuration = 0
    
    const activityMap = new Map<string, number>()

    if (days === 'all') {
      periodSessions = sessions
      sessions.forEach(s => {
        periodDuration += (s.duration_seconds || 0)
        if (s.questions_total && s.questions_total > 0) {
          periodTotalQuestions += s.questions_total
          periodWrongQuestions += (s.questions_wrong || 0)
        }
        const monthYear = s.session_date.substring(0, 7) // YYYY-MM
        activityMap.set(monthYear, (activityMap.get(monthYear) || 0) + (s.duration_seconds || 0))
      })
    } else {
      const cutOffDate = new Date(now)
      cutOffDate.setUTCDate(cutOffDate.getUTCDate() - days + 1)
      const cutOffStr = getYYYYMMDD(cutOffDate)

      const prevCutOffDate = new Date(cutOffDate)
      prevCutOffDate.setUTCDate(prevCutOffDate.getUTCDate() - days)
      const prevCutOffStr = getYYYYMMDD(prevCutOffDate)

      sessions.forEach(s => {
        if (s.session_date >= cutOffStr && s.session_date <= todayStr) {
          periodSessions.push(s)
          periodDuration += (s.duration_seconds || 0)
          if (s.questions_total && s.questions_total > 0) {
            periodTotalQuestions += s.questions_total
            periodWrongQuestions += (s.questions_wrong || 0)
          }
          activityMap.set(s.session_date, (activityMap.get(s.session_date) || 0) + (s.duration_seconds || 0))
        } else if (s.session_date >= prevCutOffStr && s.session_date < cutOffStr) {
          prevPeriodSessions.push(s)
          if (s.questions_total && s.questions_total > 0) {
            prevTotalQuestions += s.questions_total
            prevWrongQuestions += (s.questions_wrong || 0)
          }
        }
      })
    }

    // Calcula Precisão (questions_total - questions_wrong)
    const accuracy = periodTotalQuestions > 0 ? Math.round(((periodTotalQuestions - periodWrongQuestions) / periodTotalQuestions) * 100) : null
    const prevAccuracy = prevTotalQuestions > 0 ? Math.round(((prevTotalQuestions - prevWrongQuestions) / prevTotalQuestions) * 100) : null

    // Lógica Estrita de Evolução
    let evolutionLabel = "— Dados insuficientes para comparar"
    if (accuracy !== null && prevAccuracy !== null) {
      const diff = accuracy - prevAccuracy
      evolutionLabel = diff === 0 ? '0 p.p.' : `${diff > 0 ? '+' : ''}${diff} p.p.`
    }

    // Formatação de Tempo
    const hours = Math.floor(periodDuration / 3600)
    const minutes = Math.floor((periodDuration % 3600) / 60)
    const timeFormatted = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`

    // Atividade Visual (Gráfico)
    let activityChart = []
    if (days === 'all') {
      const sortedMonths = Array.from(activityMap.keys()).sort()
      activityChart = sortedMonths.map(m => {
        const [yy, mm] = m.split('-')
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        const labelStr = `${monthNames[parseInt(mm)-1]} ${yy}`
        return { 
          dateStr: m, 
          label: labelStr,
          fullDate: labelStr,
          value: activityMap.get(m) ? Number((activityMap.get(m)! / 3600).toFixed(2)) : 0,
          rawSeconds: activityMap.get(m) || 0
        } 
      })
    } else {
      // Preenche os dias vazios também com as datas reais correspondentes
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setUTCDate(d.getUTCDate() - i)
        const dStr = getYYYYMMDD(d)
        const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        const dayNamesFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
        const [yy, mm, dd] = dStr.split('-')
        
        // Define o label curto: se for 7 dias, mostra dia da semana, se não mostra a data
        let displayLabel = ''
        if (days === 7) displayLabel = dayNamesShort[d.getUTCDay()]
        else displayLabel = `${dd}/${mm}`

        activityChart.push({
          dateStr: dStr,
          label: displayLabel,
          fullDate: `${dayNamesFull[d.getUTCDay()]}, ${dd}/${mm}`,
          value: activityMap.get(dStr) ? Number((activityMap.get(dStr)! / 3600).toFixed(2)) : 0, 
          rawSeconds: activityMap.get(dStr) || 0
        })
      }
    }

    return {
      timeFormatted,
      questions: periodTotalQuestions,
      accuracy,
      evolutionLabel,
      activityChart
    }
  }

  const periods = {
    '7': calculatePeriod(7),
    '14': calculatePeriod(14),
    '30': calculatePeriod(30),
    'all': calculatePeriod('all')
  }

  // ----------------------------------------------------
  // ANÁLISE POR MATÉRIA (Base para Recomendações)
  // ----------------------------------------------------
  const startOfWeek = new Date(now)
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - currentDayOfWeek + 1)
  const startOfWeekStr = getYYYYMMDD(startOfWeek)

  let todaySeconds = 0
  const errorsBySubject: Record<string, number> = {}
  if (errosData) {
    errosData.forEach(e => {
      if (e.materia_id && e.erros_recorrentes_count > 0) {
        errorsBySubject[e.materia_id] = (errorsBySubject[e.materia_id] || 0) + e.erros_recorrentes_count
      }
    })
  }

  const processedSubjects = materias.map(m => {
    let weeklySeconds = 0
    let totalQ = 0
    let wrongQ = 0
    let recentQ = 0
    let recentWrong = 0
    let lastStudiedAt: string | null = null
    const durations: number[] = []

    const mSessions = sessions.filter(s => s.materia_id === m.id)
    
    mSessions.forEach(s => {
      if (s.session_date === todayStr) todaySeconds += (s.duration_seconds || 0)
      if (s.session_date >= startOfWeekStr) weeklySeconds += (s.duration_seconds || 0)
      
      if (!lastStudiedAt || s.session_date > lastStudiedAt) lastStudiedAt = s.session_date
      durations.push(s.duration_seconds || 0)

      if (s.questions_total && s.questions_total > 0) {
        totalQ += s.questions_total
        wrongQ += (s.questions_wrong || 0)
        // Recência = últimos 14 dias para precisão recomendada
        const fourteenDaysAgo = new Date(now)
        fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14)
        if (s.session_date >= getYYYYMMDD(fourteenDaysAgo)) {
          recentQ += s.questions_total
          recentWrong += (s.questions_wrong || 0)
        }
      }
    })

    const weeklyStudiedHours = weeklySeconds / 3600
    const goalHours = m.goal_hours || 1
    const missingHours = goalHours - weeklyStudiedHours
    const requiredPacePerDay = missingHours > 0 ? (missingHours / daysRemainingWeek) : 0
    const progress = Math.min(Math.round((weeklyStudiedHours / goalHours) * 100), 100)
    
    // Status Semântico de Matéria
    let statusLabel = 'No ritmo'
    let statusColor = 'bg-primary-100 text-primary-700'

    if (weeklySeconds === 0) {
      statusLabel = 'Não iniciada'
      statusColor = 'bg-slate-100 text-slate-600'
    } else if (missingHours <= 0) {
      statusLabel = 'Meta alcançada'
      statusColor = 'bg-emerald-100 text-emerald-700'
    } else if (requiredPacePerDay > 1.5) {
      statusLabel = 'Atrasado'
      statusColor = 'bg-red-100 text-red-700'
    }

    const accuracy = totalQ > 0 ? Math.round(((totalQ - wrongQ) / totalQ) * 100) : null
    const recentAccuracy = recentQ > 0 ? Math.round(((recentQ - recentWrong) / recentQ) * 100) : accuracy

    const sortedDurations = [...durations].sort((a, b) => a - b)
    const medianDurationMinutes = sortedDurations.length > 0 
      ? Math.round(sortedDurations[Math.floor(sortedDurations.length / 2)] / 60)
      : 30

    return {
      id: m.id,
      name: m.name,
      weeklyGoal: goalHours,
      missingHours,
      progress,
      statusLabel,
      statusColor,
      daysRemainingWeek,
      weeklyStudiedFormatted: `${Math.floor(weeklySeconds/3600)}h ${Math.floor((weeklySeconds%3600)/60)}m`,
      accuracy,
      recentAccuracy,
      lastStudiedAt,
      sessionCount: mSessions.length,
      medianDurationMinutes,
      errors: errorsBySubject[m.id] || 0
    }
  })

  // ----------------------------------------------------
  // MOTOR DE RECOMENDAÇÃO E DIAGNÓSTICO
  // ----------------------------------------------------
  let recommendation = null
  let bestScore = -1
  const diagnostics: any[] = []

  processedSubjects.forEach(sub => {
    let score = 0
    const reasons: string[] = []
    let addedDiag = false

    // 1. Erros Recorrentes (Foco em Qualidade)
    if (sub.errors >= 3) {
      score += 40 + sub.errors
      reasons.push(`Você possui ${sub.errors} erros recorrentes para corrigir no caderno.`)
      diagnostics.push({ type: 'erros', subject: sub.name, msg: `Revisão necessária: ${sub.errors} erros acumulados.` })
      addedDiag = true
    }

    // 2. Queda/Baixa Precisão Recente
    if (sub.recentAccuracy !== null && sub.recentAccuracy < 65) {
      score += 30
      reasons.push(`Sua precisão recente caiu para ${sub.recentAccuracy}%.`)
      if (!addedDiag) {
        diagnostics.push({ type: 'desempenho', subject: sub.name, msg: `Atenção ao desempenho recente (${sub.recentAccuracy}%).` })
        addedDiag = true
      }
    }

    // 3. Negligência
    if (sub.statusLabel === 'Não iniciada') {
      score += 10
      reasons.push('Nenhum estudo registrado. Comece para gerar histórico.')
    } else if (sub.lastStudiedAt) {
      const daysSince = Math.floor((now.getTime() - new Date(sub.lastStudiedAt + 'T12:00:00Z').getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince >= 5) {
        score += 20
        reasons.push(`Você está há ${daysSince} dias sem estudar esta matéria.`)
        if (!addedDiag && daysSince >= 7) diagnostics.push({ type: 'consistencia', subject: sub.name, msg: `Matéria sem atividade há ${daysSince} dias.` })
      }
    }

    // 4. Déficit de Ritmo Volume
    if (sub.statusLabel === 'Atrasado' || sub.statusLabel === 'No ritmo') {
      score += sub.statusLabel === 'Atrasado' ? 25 : 15
      reasons.push(`Faltam ${sub.missingHours.toFixed(1)}h para bater sua meta semanal.`)
      if (!addedDiag && sub.statusLabel === 'Atrasado') diagnostics.push({ type: 'volume', subject: sub.name, msg: `Ritmo abaixo do esperado para a meta da semana.` })
    }

    if (score > bestScore || bestScore === -1) {
      bestScore = score
      recommendation = {
        materiaId: sub.id,
        subject: sub.name,
        topic: sub.errors > 0 ? 'Foco na Correção' : (sub.statusLabel === 'Não iniciada' ? 'Primeiro Estudo' : 'Retomar Trilha'),
        duration: sub.medianDurationMinutes,
        accuracy: sub.recentAccuracy,
        reason: reasons.length > 0 ? reasons.join(' ') : 'Você está com um ótimo ritmo. Continue avançando!',
        actionUrl: `/dashboard/timer?materiaId=${sub.id}`
      }
    }
  })

  // Calcular progresso do "Hoje"
  let todayProgress = 0
  if (dailyGoalHours > 0) {
    todayProgress = Math.min(Math.round(((todaySeconds / 3600) / dailyGoalHours) * 100), 100)
  }

  return {
    success: true,
    data: {
      userName,
      current: {
        today: {
          timeFormatted: `${Math.floor(todaySeconds/3600)}h ${Math.floor((todaySeconds%3600)/60)}min`,
          goal: dailyGoalHours,
          progress: todayProgress
        },
        streak: {
          current: currentStreak,
          best: bestStreak
        },
        recommendation,
        diagnostics: diagnostics.slice(0, 3)
      },
      periods,
      subjects: processedSubjects
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