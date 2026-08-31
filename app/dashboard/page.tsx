import { getCalendarData } from './calendario/actions'
import { getTasks, getDashboardStats } from './actions'
import { getMaterias } from './materias/actions'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const [calendarResult, tasksResult, statsResult, materiasResult] = await Promise.all([
    getCalendarData(),
    getTasks(),
    getDashboardStats(),
    getMaterias()
  ])

  const events = calendarResult.error ? [] : (calendarResult.events || [])
  const subjects = calendarResult.error ? [] : (calendarResult.subjects || [])
  const tasks = tasksResult.error ? [] : (tasksResult.tasks || [])
  const stats = statsResult?.success && statsResult.data ? statsResult.data : null
  const materias = materiasResult?.success && materiasResult.data ? materiasResult.data : []

  return (
    <DashboardClient 
      initialEvents={events} 
      initialSubjects={subjects} 
      initialTasks={tasks} 
      initialStats={stats as any} 
      initialMaterias={materias as any}
    />
  )
}