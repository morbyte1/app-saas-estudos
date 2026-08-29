'use server'

import { createClient } from '@/utils/supabase/server'

export async function getRealEstatisticas() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Usuário não autenticado' }

  // Busca todos os dados necessários em paralelo
  const [
    { data: materias },
    { data: sessions },
    { data: topicos },
    { data: assuntos }
  ] = await Promise.all([
    supabase.from('materias').select('id, name').eq('user_id', user.id),
    supabase.from('study_sessions').select('materia_id, duration_seconds, questions_done, questions_wrong').eq('user_id', user.id),
    supabase.from('topicos').select('id, materia_id').eq('user_id', user.id),
    supabase.from('assuntos').select('topico_id, is_done').eq('user_id', user.id)
  ])

  let totalDuration = 0
  let totalQuestionsDone = 0
  let totalQuestionsWrong = 0
  let totalTopicosFeitos = 0

  // Inicializa mapa de estatísticas por matéria
  const materiaStats: Record<string, { name: string, duration: number, qDone: number, qWrong: number, topicosFeitos: number }> = {}
  
  if (materias) {
    materias.forEach(m => {
      materiaStats[m.id] = { name: m.name, duration: 0, qDone: 0, qWrong: 0, topicosFeitos: 0 }
    })
  }

  // Agrega dados das sessões de estudo (Tempo e Questões)
  if (sessions) {
    sessions.forEach(s => {
      const duration = s.duration_seconds || 0
      const qDone = s.questions_done || 0
      const qWrong = s.questions_wrong || 0

      totalDuration += duration
      totalQuestionsDone += qDone
      totalQuestionsWrong += qWrong

      if (s.materia_id && materiaStats[s.materia_id]) {
        materiaStats[s.materia_id].duration += duration
        materiaStats[s.materia_id].qDone += qDone
        materiaStats[s.materia_id].qWrong += qWrong
      }
    })
  }

  // Agrega dados de tópicos concluídos (Assuntos com is_done = true)
  if (assuntos) {
    assuntos.forEach(a => {
      if (a.is_done) {
        totalTopicosFeitos++
        const topico = topicos?.find(t => t.id === a.topico_id)
        if (topico && materiaStats[topico.materia_id]) {
          materiaStats[topico.materia_id].topicosFeitos++
        }
      }
    })
  }

  // Cálculos Globais
  const totalQuestions = totalQuestionsDone + totalQuestionsWrong
  const globalPrecision = totalQuestions > 0 ? Math.round((totalQuestionsDone / totalQuestions) * 100) : 0

  const statsArray = Object.values(materiaStats)

  // Função auxiliar de formatação de tempo
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}min`
    return `${mins}min`
  }

  // --- Funções Auxiliares para Destaques ---
  const getMaisEstudada = () => {
    const valid = statsArray.filter(s => s.duration > 0)
    if (!valid.length) return '-'
    return valid.reduce((p, c) => p.duration > c.duration ? p : c).name
  }

  const getMenosEstudada = () => {
    const valid = statsArray.filter(s => s.duration > 0)
    if (!valid.length) return '-'
    return valid.reduce((p, c) => p.duration < c.duration ? p : c).name
  }

  const getMaisTopicos = () => {
    const valid = statsArray.filter(s => s.topicosFeitos > 0)
    if (!valid.length) return '-'
    return valid.reduce((p, c) => p.topicosFeitos > c.topicosFeitos ? p : c).name
  }

  const getMenosTopicos = () => {
    const valid = statsArray.filter(s => s.topicosFeitos > 0)
    if (!valid.length) return '-'
    return valid.reduce((p, c) => p.topicosFeitos < c.topicosFeitos ? p : c).name
  }

  const getPrecisao = () => {
    const valid = statsArray.filter(s => (s.qDone + s.qWrong) > 0)
    if (!valid.length) return { melhor: '-', pior: '-' }
    
    const mapped = valid.map(s => ({
      name: s.name,
      prec: Math.round((s.qDone / (s.qDone + s.qWrong)) * 100)
    }))
    const melhor = mapped.reduce((p, c) => p.prec > c.prec ? p : c)
    const pior = mapped.reduce((p, c) => p.prec < c.prec ? p : c)
    return {
      melhor: `${melhor.name} - ${melhor.prec}%`,
      pior: `${pior.name} - ${pior.prec}%`
    }
  }

  const getQuestoes = () => {
    const valid = statsArray.filter(s => (s.qDone + s.qWrong) > 0)
    if (!valid.length) return { mais: '-', menos: '-' }
    
    const mapped = valid.map(s => ({
      name: s.name,
      total: s.qDone + s.qWrong
    }))
    const mais = mapped.reduce((p, c) => p.total > c.total ? p : c)
    const menos = mapped.reduce((p, c) => p.total < c.total ? p : c)
    return {
      mais: `${mais.name} - ${mais.total}`,
      menos: `${menos.name} - ${menos.total}`
    }
  }

  const precisao = getPrecisao()
  const questoes = getQuestoes()

  return {
    success: true,
    data: {
      totalDurationFormatted: formatDuration(totalDuration),
      totalQuestions,
      globalPrecision,
      totalTopicosFeitos,
      destaques: {
        maisEstudada: getMaisEstudada(),
        menosEstudada: getMenosEstudada(),
        maisTopicos: getMaisTopicos(),
        menosTopicos: getMenosTopicos(),
        melhorPrecisao: precisao.melhor,
        piorPrecisao: precisao.pior,
        maisQuestoes: questoes.mais,
        menosQuestoes: questoes.menos
      }
    }
  }
}