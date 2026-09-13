import cursosJson from '@/data/cursos.json'
import { mapMateriaToArea } from './materiaUtils'

export const HORAS_POR_REDACAO = 1;
export function calcularDistribuicaoSugerida(
  materias: { id: string; name: string; goal_hours: number }[],
  cursoId: string | null,
  nivelPercebido: Record<string, string>,
  totalHorasDisponiveis: number,
  prioridadesManuais: Record<string, number> = {},
  horasManuaisOverride: Record<string, number> = {}
) {
  let curso = null
  if (cursoId) {
    curso = cursosJson.find(c => c.id === cursoId)
  }

  const distribuicaoPre: any[] = []
  let somaPesos = 0

  materias.forEach(m => {
    const area = mapMateriaToArea(m.name)
    let pesoCurso = 1
    
    if (curso && curso.pesos && area !== 'outros') {
      pesoCurso = (curso.pesos as any)[area] || 1
    }

    if (prioridadesManuais[m.id] !== undefined && prioridadesManuais[m.id] !== null) {
      pesoCurso = prioridadesManuais[m.id]
    }

    let prioridadeLabel = 'Baixa'
    if (pesoCurso >= 3) prioridadeLabel = 'Alta'
    else if (pesoCurso === 2) prioridadeLabel = 'Média'

    const nivel = nivelPercebido[m.id] || 'nao_definido'
    let fatorGap = 1.0
    let nivelLabel = 'Não avaliado'
    
    if (nivel === 'iniciante') {
      fatorGap = 1.5
      nivelLabel = 'Iniciante'
    } else if (nivel === 'intermediario') {
      fatorGap = 1.0
      nivelLabel = 'Intermediário'
    } else if (nivel === 'avancado') {
      fatorGap = 0.6
      nivelLabel = 'Avançado'
    }

    const pesoDist = pesoCurso * fatorGap
    const hasOverride = horasManuaisOverride[m.id] !== undefined && horasManuaisOverride[m.id] !== null

    if (!hasOverride) {
      somaPesos += pesoDist
    }

    distribuicaoPre.push({
      id: m.id,
      name: m.name,
      pesoDist,
      hasOverride,
      overrideValue: horasManuaisOverride[m.id] || 0,
      motivoTexto: `Prioridade ${prioridadeLabel} + Nível ${nivelLabel}`
    })
  })

  let horasParaDistribuir = totalHorasDisponiveis
  distribuicaoPre.forEach(d => {
    if (d.hasOverride) {
      horasParaDistribuir -= d.overrideValue
    }
  })

  if (horasParaDistribuir < 0) horasParaDistribuir = 0

  return distribuicaoPre.map(d => {
    let horasSugeridas = 0
    if (d.hasOverride) {
      horasSugeridas = d.overrideValue
    } else {
      if (somaPesos > 0) {
        horasSugeridas = (d.pesoDist / somaPesos) * horasParaDistribuir
      }
    }
    
    let horasArredondadas = Math.round(horasSugeridas * 2) / 2

    return {
      id: d.id,
      name: d.name,
      horasSugeridas: horasArredondadas,
      horasManuais: d.hasOverride ? d.overrideValue : null,
      motivoTexto: d.motivoTexto
    }
  }).sort((a, b) => b.horasSugeridas - a.horasSugeridas)
}