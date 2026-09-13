import { getMaterias } from '../materias/actions'
import { getCadernoErros, getTodosAssuntos } from './actions'
import CadernoClient from './CadernoClient'

export default async function CadernoErrosPage() {
  const [materiasResult, assuntosResult, errosResult] = await Promise.all([
    getMaterias(),
    getTodosAssuntos(),
    getCadernoErros()
  ])

  const materias = materiasResult.success && materiasResult.data ? materiasResult.data : []
  const assuntos = assuntosResult.success && assuntosResult.data ? assuntosResult.data : []
  const erros = errosResult.success && errosResult.data ? errosResult.data : []

  return (
    <CadernoClient 
      initialMaterias={materias as any} 
      initialAssuntos={assuntos} 
      initialErros={erros} 
    />
  )
}