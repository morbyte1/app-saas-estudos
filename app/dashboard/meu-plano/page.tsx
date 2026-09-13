import { getMeuPlanoData } from './actions'
import MeuPlanoClient from './MeuPlanoClient'

export default async function MeuPlanoPage() {
  const res = await getMeuPlanoData()

  const data = res.success && res.data ? res.data : {
    settings: { horas_dias_semana: 2, horas_sabado: 3, horas_domingo: 3, redacao_frequencia_semanal: 1, updated_at: null },
    distribuicao: [],
    cursoId: null,
    sugestaoRedacao: 1,
    totalHorasDisponiveis: 16
  }

  return <MeuPlanoClient initialData={data as any} />
}