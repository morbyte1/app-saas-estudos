import { DayContext } from '@/app/painel/calendario/actions'

export interface SugestaoDia {
  materiaId: string
  materiaNome: string
  duracaoSugerida: number
  motivoTexto: string
}

export function gerarSugestaoDoDia(dayContext: DayContext | null): SugestaoDia | null {
  if (!dayContext) return null

  if (dayContext.espacoLivre < 0.5) {
    return null
  }

  if (!dayContext.materiasPendentes || dayContext.materiasPendentes.length === 0) {
    return null
  }

  if (dayContext.diasRestantesSemana <= 0) {
    return null
  }

  const sorted = [...dayContext.materiasPendentes].sort((a, b) => b.pesoPonderado - a.pesoPonderado)
  const selecionada = sorted[0]

  if (!selecionada) return null

  const duracaoSugerida = Number(Math.min(dayContext.espacoLivre, selecionada.deficit).toFixed(1))

  if (duracaoSugerida < 0.5) {
    return null
  }

  return {
    materiaId: selecionada.materiaId,
    materiaNome: selecionada.materiaNome,
    duracaoSugerida,
    motivoTexto: selecionada.motivoTexto
  }
}