import { getTimerHistory } from '../timer/actions'
import HistoricoClient from './HistoricoClient'

export default async function HistoricoPage() {
  const historyResult = await getTimerHistory()
  const history = historyResult.success && historyResult.data ? historyResult.data : []

  const formattedHistory = history.map((session: any) => ({
    ...session,
    materias: Array.isArray(session.materias) ? session.materias[0] : session.materias,
    assuntos: Array.isArray(session.assuntos) ? session.assuntos[0] : session.assuntos,
  }))

  return <HistoricoClient initialHistory={formattedHistory} />
}