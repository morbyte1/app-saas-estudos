import { getTasks, getDashboardStats } from './actions'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const [tasksResult, statsResult] = await Promise.all([getTasks(), getDashboardStats()])
  if (!statsResult.success || !statsResult.data) {
    return <main className="min-h-screen bg-slate-50 p-8 text-slate-800"><div className="mx-auto max-w-7xl rounded-2xl bg-white p-6" role="alert">Não foi possível carregar a Dashboard. {statsResult.error}</div></main>
  }

  return (
    <DashboardClient 
      initialTasks={tasksResult.tasks || []}
      initialStats={statsResult.data}
    />
  )
}
