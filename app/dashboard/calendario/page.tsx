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
  
  // Extrai os minutos a partir da nova string formatada que a Dashboard fornece
  let todayMinutes = 0
  if (statsResult?.success && statsResult.data) {
    const timeStr = statsResult.data.current.today.timeFormatted || ""
    const hoursMatch = timeStr.match(/(\d+)h/)
    const minsMatch = timeStr.match(/(\d+)m/)
    
    const h = hoursMatch ? parseInt(hoursMatch[1]) : 0
    const m = minsMatch ? parseInt(minsMatch[1]) : 0
    todayMinutes = (h * 60) + m
  }

  // Acessa os dados a partir do novo encapsulamento current.today
  const dailyStats = statsResult?.success && statsResult.data ? {
    goal: statsResult.data.current.today.goal,
    todayMinutes: todayMinutes
  } : { goal: 3, todayMinutes: 0 }

  return (
    <CalendarioClient 
      initialEvents={events} 
      initialMaterias={materias} 
      initialDailyStats={dailyStats} 
    />
  )
}