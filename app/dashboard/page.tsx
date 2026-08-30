import { getCalendarData } from './calendario/actions'
import { getTasks, getDashboardStats } from './actions'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const [calendarResult, tasksResult, statsResult] = await Promise.all([
    getCalendarData(),
    getTasks(),
    getDashboardStats()
  ])

  const events = calendarResult.error ? [] : (calendarResult.events || [])
  const subjects = calendarResult.error ? [] : (calendarResult.subjects || [])
  const tasks = tasksResult.error ? [] : (tasksResult.tasks || [])
  const stats = statsResult?.success && statsResult.data ? statsResult.data : null

  return (
    <DashboardClient 
      initialEvents={events} 
      initialSubjects={subjects} 
      initialTasks={tasks} 
      initialStats={stats as any} 
    />
  )
}