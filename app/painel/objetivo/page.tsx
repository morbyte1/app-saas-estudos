import { getObjetivoData } from './actions'
import ObjetivoClient from './ObjetivoClient'

export default async function ObjetivoPage() {
  const res = await getObjetivoData()

  const initialData = res.success && res.data ? res.data : {
    examGoal: null,
    context: null,
    materias: []
  }

  return <ObjetivoClient initialData={initialData as any} />
}