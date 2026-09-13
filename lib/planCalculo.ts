import { mapMateriaToArea } from './materiaUtils'
import cursosJson from '@/data/cursos.json'

export interface DistribuicaoMateria {
  id: string
  name: string
  horasSugeridas: number
  horasManuais: number | null
  motivoTexto: string
}

export function calcularPesoMateria(
  materiaName: string,
  cursoId: string | null,
  niveisPercebidos: Record<string, string>,
  materiaId: string,
  prioridadeManual?: 'baixa' | 'media' | 'alta' | null
): { pesoFinal: number; motivoTexto: string } {
  const area = mapMateriaToArea(materiaName)
  
  let pesoArea = 1
  if (cursoId) {
    const curso = cursosJson.find(c => c.id === cursoId)
    if (curso && area !== 'outros') {
      pesoArea = curso.pesos[area as keyof typeof curso.pesos] || 1
    }
  }

  let prioridadeTexto = 'Prioridade Média'
  let pesoPrioridade = 1.0

  if (prioridadeManual) {
    if (prioridadeManual === 'alta') {
      prioridadeTexto = 'Prioridade Alta'
      pesoPrioridade = 1.4
    } else if (prioridadeManual === 'baixa') {
      prioridadeTexto = 'Prioridade Baixa'
      pesoPrioridade = 0.7
    } else {
      prioridadeTexto = 'Prioridade Média'
      pesoPrioridade = 1.0
    }
  } else {
    if (pesoArea >= 3) {
      prioridadeTexto = 'Prioridade Alta'
      pesoPrioridade = 1.3
    } else if (pesoArea === 2) {
      prioridadeTexto = 'Prioridade Média'
      pesoPrioridade = 1.0
    } else {
      prioridadeTexto = 'Prioridade Baixa'
      pesoPrioridade = 0.8
    }
  }

  const nivel = niveisPercebidos[materiaId]
  let fatorDificuldade = 1.0
  let nivelTexto = 'Não avaliado'

  if (nivel === 'iniciante') {
    fatorDificuldade = 1.3
    nivelTexto = 'Nível Iniciante'
  } else if (nivel === 'intermediario') {
    fatorDificuldade = 1.0
    nivelTexto = 'Nível Intermediário'
  } else if (nivel === 'avancado') {
    fatorDificuldade = 0.7
    nivelTexto = 'Nível Avançado'
  }

  const pesoFinal = pesoPrioridade * fatorDificuldade
  const motivoTexto = `${prioridadeTexto} • ${nivelTexto}`

  return { pesoFinal, motivoTexto }
}

export function calcularDistribuicaoSugerida(
  materias: { id: string; name: string }[],
  cursoId: string | null,
  niveisPercebidos: Record<string, string>,
  horasSemanaisDisponiveis: number,
  prioridadesManuais: Record<string, 'baixa' | 'media' | 'alta'> = {},
  horasManuaisOverride: Record<string, number> = {}
): DistribuicaoMateria[] {
  if (materias.length === 0) return []

  let horasRestantes = horasSemanaisDisponiveis
  const resultado: DistribuicaoMateria[] = []
  const materiasParaCalcular: { id: string; name: string; pesoFinal: number; motivoTexto: string }[] = []

  materias.forEach(m => {
    const override = horasManuaisOverride[m.id]
    const { pesoFinal, motivoTexto } = calcularPesoMateria(
      m.name,
      cursoId,
      niveisPercebidos,
      m.id,
      prioridadesManuais[m.id]
    )

    if (override !== undefined && override !== null) {
      resultado.push({
        id: m.id,
        name: m.name,
        horasSugeridas: override,
        horasManuais: override,
        motivoTexto
      })
      horasRestantes -= override
    } else {
      materiasParaCalcular.push({
        id: m.id,
        name: m.name,
        pesoFinal,
        motivoTexto
      })
    }
  })

  if (materiasParaCalcular.length > 0) {
    const horasParaDistribuir = Math.max(horasRestantes, 0)
    const somaPesos = materiasParaCalcular.reduce((acc, m) => acc + m.pesoFinal, 0)

    let horasDistribuidas = 0
    materiasParaCalcular.forEach((m, index) => {
      let horasCalculadas = 0
      if (somaPesos > 0) {
        const proporcao = m.pesoFinal / somaPesos
        horasCalculadas = Math.round(proporcao * horasParaDistribuir)
      }

      horasCalculadas = Math.max(horasCalculadas, 1)
      horasDistribuidas += horasCalculadas

      resultado.push({
        id: m.id,
        name: m.name,
        horasSugeridas: horasCalculadas,
        horasManuais: null,
        motivoTexto: m.motivoTexto
      })
    })

    const diferenca = horasParaDistribuir - horasDistribuidas
    if (diferenca !== 0 && resultado.filter(r => r.horasManuais === null).length > 0) {
      const ajustavel = resultado.find(r => r.horasManuais === null)
      if (ajustavel) {
        ajustavel.horasSugeridas = Math.max(ajustavel.horasSugeridas + diferenca, 1)
      }
    }
  }

  return resultado
}