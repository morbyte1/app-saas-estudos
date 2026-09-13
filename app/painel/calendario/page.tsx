import { getCalendarData, getDayContext } from './actions'
import CalendarioClient from './CalendarioClient'

export default async function CalendarioPage() {
  const now = new Date()
  now.setUTCHours(now.getUTCHours() - 3)
  const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`

  const [calendarResult, dayContextResult] = await Promise.all([
    getCalendarData(),
    getDayContext(todayStr)
  ])

  const events = calendarResult.error ? [] : (calendarResult.events || [])
  const materias = calendarResult.error ? [] : (calendarResult.materias || [])
  const initialDayContext = dayContextResult.success && dayContextResult.data ? dayContextResult.data : null

  return (
    <CalendarioClient 
      initialEvents={events} 
      initialMaterias={materias} 
      initialDayContext={initialDayContext}
    />
  )
}