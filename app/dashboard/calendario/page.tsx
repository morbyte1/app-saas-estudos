import { getCalendarData } from './actions'
import { getDashboardStats } from '../actions'
import CalendarioClient from './CalendarioClient'

export default async function CalendarioPage() {
  const [calendarResult, statsResult] = await Promise.all([
    getCalendarData(),
    getDashboardStats()
  ])

  const events = calendarResult.error ? [] : (calendarResult.events || [])
  const materias = calendarResult.error ? [] : (calendarResult.materias || [])
  
  const dailyStats = statsResult?.success && statsResult.data ? {
    goal: statsResult.data.dailyGoalHours,
    todayMinutes: statsResult.data.todayMinutes
  } : { goal: 3, todayMinutes: 0 }

  return (
    <CalendarioClient 
      initialEvents={events} 
      initialMaterias={materias} 
      initialDailyStats={dailyStats} 
    />
  )
}