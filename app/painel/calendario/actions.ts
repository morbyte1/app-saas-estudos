'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { calcularPesoMateria } from '@/lib/planCalculo'

export interface MateriaPendente {
  materiaId: string
  materiaNome: string
  goalHours: number
  weeklyStudiedHours: number
  deficit: number
  pesoPonderado: number
  motivoTexto: string
}

export interface DayContext {
  dateStr: string
  disponibilidadeDia: number
  jaAgendadoDia: number
  jaEstudadoDia: number
  espacoLivre: number
  materiasPendentes: MateriaPendente[]
  materiasSemanaStatus: {
    materiaId: string
    materiaNome: string
    goalHours: number
    weeklyStudiedHours: number
  }[]
  diasRestantesSemana: number
}

export async function getCalendarData() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError?.message)
    return { error: 'User not authenticated', events: [], materias: [] }
  }

  const { data: events, error: eventsError } = await supabase
    .from('schedule_events')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: true })

  if (eventsError) {
    console.error('Error fetching events:', eventsError.message)
    return { error: eventsError.message, events: [], materias: [] }
  }

  const { data: materias, error: materiasError } = await supabase
    .from('materias')
    .select('*')
    .eq('user_id', user.id)

  if (materiasError) {
    console.error('Error fetching materias:', materiasError.message)
    return { error: materiasError.message, events: events || [], materias: [] }
  }

  return { events: events || [], materias: materias || [] }
}

export async function createEvent(data: {
  title: string
  time: string
  duration: number
  subject_id: string
  event_date: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError?.message)
    return { error: 'User not authenticated' }
  }

  const { data: newEvent, error } = await supabase.from('schedule_events').insert({
    user_id: user.id,
    title: data.title,
    time: data.time,
    duration: data.duration,
    subject_id: data.subject_id,
    event_date: data.event_date,
    is_done: false,
  }).select().single()

  if (error) {
    console.error('Error creating event:', error.message)
    return { error: error.message }
  }

  revalidatePath('/painel/calendario')
  return { success: true, event: newEvent }
}

export async function updateEvent(id: string, data: {
  title?: string
  time?: string
  duration?: number
  subject_id?: string
  event_date?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError?.message)
    return { error: 'User not authenticated' }
  }

  const { data: updatedEvent, error } = await supabase
    .from('schedule_events')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating event:', error.message)
    return { error: error.message }
  }

  revalidatePath('/painel/calendario')
  return { success: true, event: updatedEvent }
}

export async function deleteEvent(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError?.message)
    return { error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('schedule_events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting event:', error.message)
    return { error: error.message }
  }

  revalidatePath('/painel/calendario')
  return { success: true }
}

export async function toggleEventStatus(id: string, is_done: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError?.message)
    return { error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('schedule_events')
    .update({ is_done })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error toggling event status:', error.message)
    return { error: error.message }
  }

  revalidatePath('/painel/calendario')
  return { success: true }
}

export async function duplicateEvents(
  eventIds: string[], 
  sourceDateStr: string, 
  repeatFuture: boolean
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError?.message)
    return { error: 'User not authenticated' }
  }

  const { data: sourceEvents, error: fetchError } = await supabase
    .from('schedule_events')
    .select('*')
    .in('id', eventIds)
    .eq('user_id', user.id)

  if (fetchError || !sourceEvents) {
    console.error('Error fetching events to duplicate:', fetchError?.message)
    return { error: fetchError?.message }
  }

  const sourceDate = new Date(sourceDateStr + 'T12:00:00')
  const eventsToInsert = []
  const weeksToRepeat = repeatFuture ? 4 : 1 

  for (let i = 1; i <= weeksToRepeat; i++) {
    const targetDate = new Date(sourceDate)
    targetDate.setDate(targetDate.getDate() + (7 * i))
    const targetDateString = targetDate.toISOString().split('T')[0]

    for (const event of sourceEvents) {
      eventsToInsert.push({
        user_id: user.id,
        title: event.title,
        time: event.time,
        duration: event.duration,
        subject_id: event.subject_id,
        event_date: targetDateString,
        is_done: false,
      })
    }
  }

  const { error: insertError } = await supabase
    .from('schedule_events')
    .insert(eventsToInsert)

  if (insertError) {
    console.error('Error duplicating events:', insertError.message)
    return { error: insertError.message }
  }

  revalidatePath('/painel/calendario')
  return { success: true }
}

export async function getDayContext(dateStr: string): Promise<{ success: boolean; data?: DayContext; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Usuário não autenticado' }
  }

  const [y, m, d] = dateStr.split('-').map(Number)
  const targetDateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const dayOfWeek = targetDateObj.getUTCDay() // 0 = Dom, 1 = Seg, ..., 6 = Sab
  const currentDayOfWeekISO = dayOfWeek === 0 ? 7 : dayOfWeek // 1 = Seg, 7 = Dom
  const diasRestantesSemana = 7 - currentDayOfWeekISO + 1

  const startOfWeekDate = new Date(targetDateObj)
  startOfWeekDate.setUTCDate(startOfWeekDate.getUTCDate() - currentDayOfWeekISO + 1)
  const startOfWeekStr = `${startOfWeekDate.getUTCFullYear()}-${String(startOfWeekDate.getUTCMonth() + 1).padStart(2, '0')}-${String(startOfWeekDate.getUTCDate()).padStart(2, '0')}`

  const endOfWeekDate = new Date(startOfWeekDate)
  endOfWeekDate.setUTCDate(endOfWeekDate.getUTCDate() + 6)
  const endOfWeekStr = `${endOfWeekDate.getUTCFullYear()}-${String(endOfWeekDate.getUTCMonth() + 1).padStart(2, '0')}-${String(endOfWeekDate.getUTCDate()).padStart(2, '0')}`

  const [
    eventsRes,
    sessionsDayRes,
    sessionsWeekRes,
    planSettingsRes,
    materiasRes,
    objectiveRes
  ] = await Promise.all([
    supabase.from('schedule_events').select('duration').eq('user_id', user.id).eq('event_date', dateStr),
    supabase.from('study_sessions').select('materia_id, duration_seconds').eq('user_id', user.id).eq('session_date', dateStr),
    supabase.from('study_sessions').select('materia_id, duration_seconds').eq('user_id', user.id).gte('session_date', startOfWeekStr).lte('session_date', endOfWeekStr),
    supabase.from('user_plan_settings').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('materias').select('id, name, goal_hours').eq('user_id', user.id).order('name', { ascending: true }),
    supabase.from('user_objective_context').select('curso_id, nivel_percebido').eq('user_id', user.id).maybeSingle()
  ])

  const planSettings = planSettingsRes.data || {
    horas_dias_semana: 2,
    horas_sabado: 3,
    horas_domingo: 3,
    prioridades_manuais: {}
  }

  let disponibilidadeDia = planSettings.horas_dias_semana
  if (dayOfWeek === 6) {
    disponibilidadeDia = planSettings.horas_sabado
  } else if (dayOfWeek === 0) {
    disponibilidadeDia = planSettings.horas_domingo
  }
  disponibilidadeDia = Number(disponibilidadeDia || 0)

  const dayEvents = eventsRes.data || []
  const totalMinutesAgendados = dayEvents.reduce((acc, e) => acc + (e.duration || 0), 0)
  const jaAgendadoDia = Number((totalMinutesAgendados / 60).toFixed(1))

  const daySessions = sessionsDayRes.data || []
  const totalSecondsEstudadosDia = daySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
  const jaEstudadoDia = Number((totalSecondsEstudadosDia / 3600).toFixed(1))

  const espacoLivre = Number(Math.max(disponibilidadeDia - jaAgendadoDia - jaEstudadoDia, 0).toFixed(1))

  const weekSessions = sessionsWeekRes.data || []
  const weeklyStudiedMap: Record<string, number> = {}
  weekSessions.forEach(s => {
    if (s.materia_id) {
      weeklyStudiedMap[s.materia_id] = (weeklyStudiedMap[s.materia_id] || 0) + (s.duration_seconds || 0)
    }
  })

  const materias = materiasRes.data || []
  const cursoId = objectiveRes.data?.curso_id || null
  const niveisPercebidos = objectiveRes.data?.nivel_percebido || {}
  const prioridadesManuais = planSettings.prioridades_manuais || {}

  const materiasPendentes: MateriaPendente[] = []
  const materiasSemanaStatus = materias.map(m => {
    const goalHours = Number(m.goal_hours || 1)
    const studiedSecs = weeklyStudiedMap[m.id] || 0
    const weeklyStudiedHours = Number((studiedSecs / 3600).toFixed(1))
    const deficit = Number(Math.max(goalHours - weeklyStudiedHours, 0).toFixed(1))

    const { pesoFinal, motivoTexto } = calcularPesoMateria(
      m.name,
      cursoId,
      niveisPercebidos,
      m.id,
      prioridadesManuais[m.id]
    )

    if (weeklyStudiedHours < goalHours) {
      materiasPendentes.push({
        materiaId: m.id,
        materiaNome: m.name,
        goalHours,
        weeklyStudiedHours,
        deficit,
        pesoPonderado: pesoFinal,
        motivoTexto
      })
    }

    return {
      materiaId: m.id,
      materiaNome: m.name,
      goalHours,
      weeklyStudiedHours
    }
  })

  return {
    success: true,
    data: {
      dateStr,
      disponibilidadeDia,
      jaAgendadoDia,
      jaEstudadoDia,
      espacoLivre,
      materiasPendentes,
      materiasSemanaStatus,
      diasRestantesSemana
    }
  }
}