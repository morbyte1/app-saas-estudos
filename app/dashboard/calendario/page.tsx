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
  
  // CORREÇÃO: Buscando os dados de dentro do novo objeto "today"
  const dailyStats = statsResult?.success && statsResult.data ? {
    goal: statsResult.data.today.goal,
    todayMinutes: statsResult.data.today.minutes
  } : { goal: 3, todayMinutes: 0 }

  return (
    <CalendarioClient 
      initialEvents={events} 
      initialMaterias={materias} 
      initialDailyStats={dailyStats} 
    />
  )
}