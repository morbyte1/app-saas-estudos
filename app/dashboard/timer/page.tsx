import { getTimerHistory } from './actions'
import { getMaterias } from '../materias/actions'
import TimerClient from './TimerClient'

export default async function TimerPage() {
  const [materiasResult, historyResult] = await Promise.all([
    getMaterias(),
    getTimerHistory()
  ])

  const materias = materiasResult.success && materiasResult.data ? materiasResult.data : []
  const history = historyResult.success && historyResult.data ? historyResult.data : []

  // Formata o histórico do mesmo modo que o Client fazia
  const formattedHistory = history.map((session: any) => ({
    ...session,
    materias: Array.isArray(session.materias) ? session.materias[0] : session.materias,
    assuntos: Array.isArray(session.assuntos) ? session.assuntos[0] : session.assuntos,
  }))

  return (
    <TimerClient 
      initialMaterias={materias as any} 
      initialHistory={formattedHistory} 
    />
  )
}