import { getRealEstatisticas } from './actions'
import EstatisticasClient from './EstatisticasClient'

export default async function EstatisticasPage() {
  const res = await getRealEstatisticas()
  
  const stats = res.success && res.data ? res.data : {
    totalDurationFormatted: '0min',
    totalQuestions: 0,
    globalPrecision: 0,
    totalTopicosFeitos: 0,
    totalErros: 0,
    destaques: {
      maisEstudada: '-',
      menosEstudada: '-',
      maisTopicos: '-',
      menosTopicos: '-',
      melhorPrecisao: '-',
      piorPrecisao: '-',
      maisQuestoes: '-',
      menosQuestoes: '-'
    },
    annualData: [],
    monthlyData: [],
    finishedTopicsData: [],
    wrongQuestionsData: []
  }

  return <EstatisticasClient initialStats={stats} />
}