import { getEstatisticas, getMaterias } from './actions'
import MateriasClient from './MateriasClient'

export default async function MateriasPage() {
  const [statsResult, materiasResult] = await Promise.all([
    getEstatisticas(),
    getMaterias()
  ])

  const estatisticas = statsResult.success && statsResult.data ? statsResult.data : {
    totalFocus: '0h 0min',
    progress: '0%',
    activeSubjects: 0,
    dailyGoalHours: 3,
    examGoalName: null
  }

  const materias = materiasResult.success && materiasResult.data ? materiasResult.data : []

  return (
    <MateriasClient 
      initialEstatisticas={estatisticas as any} 
      initialMaterias={materias as any} 
    />
  )
}