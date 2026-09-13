import { getMaterias } from '../materias/actions'
import TimerClient from './TimerClient'

export default async function TimerPage({
  searchParams,
}: {
  searchParams: Promise<{ materiaId?: string; assuntoId?: string }>
}) {
  const [materiasResult, resolvedParams] = await Promise.all([
    getMaterias(),
    searchParams
  ])

  const materias = materiasResult.success && materiasResult.data ? materiasResult.data : []

  return (
    <TimerClient 
      initialMaterias={materias as any} 
      initialContext={{
        materiaId: resolvedParams.materiaId || '',
        assuntoId: resolvedParams.assuntoId || ''
      }}
    />
  )
}