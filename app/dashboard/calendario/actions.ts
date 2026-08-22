'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCalendarData() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError?.message)
    return { error: 'User not authenticated', events: [], subjects: [] }
  }

  // Fetch events
  const { data: events, error: eventsError } = await supabase
    .from('schedule_events')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: true })

  if (eventsError) {
    console.error('Error fetching events:', eventsError.message)
    return { error: eventsError.message, events: [], subjects: [] }
  }

  // Fetch subjects
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', user.id)

  if (subjectsError) {
    console.error('Error fetching subjects:', subjectsError.message)
    return { error: subjectsError.message, events: events || [], subjects: [] }
  }

  return { events: events || [], subjects: subjects || [] }
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

  const { error } = await supabase.from('schedule_events').insert({
    user_id: user.id,
    title: data.title,
    time: data.time,
    duration: data.duration,
    subject_id: data.subject_id,
    event_date: data.event_date,
    is_done: false,
  })

  if (error) {
    console.error('Error creating event:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/calendario')
  return { success: true }
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

  const { error } = await supabase
    .from('schedule_events')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating event:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/calendario')
  return { success: true }
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

  revalidatePath('/dashboard/calendario')
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

  revalidatePath('/dashboard/calendario')
  return { success: true }
}

export async function createSubject(data: {
  name: string
  color: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError?.message)
    return { error: 'User not authenticated', subject: null }
  }

  const { data: subject, error } = await supabase
    .from('subjects')
    .insert({
      user_id: user.id,
      name: data.name,
      color: data.color,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating subject:', error.message)
    return { error: error.message, subject: null }
  }

  revalidatePath('/dashboard/calendario')
  return { success: true, subject }
}
