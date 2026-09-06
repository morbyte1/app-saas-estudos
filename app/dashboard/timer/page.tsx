import { getTimerHistory } from './actions'
import { getMaterias } from '../materias/actions'
import TimerClient from './TimerClient'

export default async function TimerPage({
  searchParams,
}: {
  searchParams: Promise<{ materiaId?: string; assuntoId?: string }>
}) {
  const [materiasResult, historyResult, resolvedParams] = await Promise.all([
    getMaterias(),
    getTimerHistory(),
    searchParams
  ])

  const materias = materiasResult.success && materiasResult.data ? materiasResult.data : []
  const history = historyResult.success && historyResult.data ? historyResult.data : []

  const formattedHistory = history.map((session: any) => ({
    ...session,
    materias: Array.isArray(session.materias) ? session.materias[0] : session.materias,
    assuntos: Array.isArray(session.assuntos) ? session.assuntos[0] : session.assuntos,
  }))

  return (
    <TimerClient 
      initialMaterias={materias as any} 
      initialHistory={formattedHistory} 
      initialContext={{
        materiaId: resolvedParams.materiaId || '',
        assuntoId: resolvedParams.assuntoId || ''
      }}
    />
  )
}