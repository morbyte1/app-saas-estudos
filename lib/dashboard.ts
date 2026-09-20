import {
  AMOSTRA_MINIMA_PRECISAO, analisarPadroesErros, assuntosDaMateria, dataDaSessao, dataTimestampBrasil, diferencaPrecisao,
  dentro, formatarTempo, janela, resumirSessoes, somarDiasCivis,
  type AssuntoDesempenho, type Periodo, type SessaoDesempenho,
} from './desempenho'
import { assuntoDoErro, dadosRevisaoCompletos, podeRevisar, type CadernoErro } from './caderno'

export type DashboardMateria = { id: string; name: string; goal_hours: number | null; created_at: string | null }
export type DashboardEvento = {
  id: string; title: string; event_date: string; time: string; duration: number
  subject_id: string | null; activity_type: string | null; is_done: boolean
}
export type DashboardPlano = { horas_dias_semana: number | null; horas_sabado: number | null; horas_domingo: number | null } | null
export type DashboardInsight = {
  family: 'aprendizado' | 'erros' | 'ritmo' | 'pratica' | 'planejamento' | 'conquista'
  title: string; message: string; tone: 'positive' | 'neutral' | 'attention'
}
export type DashboardStep = {
  kind: 'review' | 'calendar' | 'difficulty' | 'neglect' | 'deficit' | 'maintenance' | 'first'
  title: string; subtitle?: string; reason: string; href: string; cta: string
  duration?: number; questions?: number
}
export type DashboardSubject = {
  id: string; name: string; weeklyGoal: number; weeklyStudiedSeconds: number
  progress: number | null; priority: string; signal: 'accuracy' | 'accuracyModerate' | 'drop' | 'rhythm' | 'planning'
}
export type DashboardPeriod = {
  seconds: number; questions: number; sessions: number; accuracy: number | null; evolution: number | null
  previous: { seconds: number; questions: number; sessions: number } | null
}
export type DashboardOutput = {
  maturity: 'new' | 'learning' | 'ready'
  today: { seconds: number; goal: number | null; progress: number | null }
  streak: { current: number; best: number }
  recommendation: DashboardStep
  insights: DashboardInsight[]
  periods: Record<Periodo, DashboardPeriod>
  subjects: DashboardSubject[]
  materias: { id: string; name: string }[]
  events: DashboardEvento[]
  examGoal: { name: string; target_date: string } | null
}
export type DashboardInput = {
  today: string; time: string
  sessions: SessaoDesempenho[]; materias: DashboardMateria[]; assuntos: AssuntoDesempenho[]
  erros: CadernoErro[]; events: DashboardEvento[]; plan: DashboardPlano
  examGoal: { name: string; target_date: string } | null
}

type EvidenceConfidence = 'insufficient' | 'sufficient'
type Candidate = {
  step: DashboardStep; urgency: number; severity: number; alignment: number; key: string
  subjectId?: string; confidence: EvidenceConfidence; signal?: DashboardSubject['signal']
}

// target_date representa a data civil da prova, mesmo quando o banco a devolve como timestamp.
export function formatarDataObjetivo(value: string): string | null {
  const civil = /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0]
  if (!civil) return null
  const date = new Date(`${civil}T12:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== civil) return null
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(date)
}

export function formatarDiferencaTempo(seconds: number): string {
  const minutes = Math.round(Math.abs(seconds) / 60)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  const formatted = hours ? `${hours}h${rest ? ` ${rest}min` : ''}` : `${minutes} min`
  return `${minutes === 0 ? '' : seconds > 0 ? '+' : '−'}${formatted}`
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
const roundFive = (value: number) => Math.max(5, Math.round(value / 5) * 5)
const timerUrl = (materiaId?: string, assuntoId?: string) =>
  `/painel/timer${materiaId ? `?materiaId=${encodeURIComponent(materiaId)}${assuntoId ? `&assuntoId=${encodeURIComponent(assuntoId)}` : ''}` : ''}`
const reviewUrl = '/painel/caderno?area=revisoes'
type CandidateRank = Pick<Candidate, 'urgency' | 'severity' | 'alignment' | 'key'>
const compareCandidates = (a: CandidateRank, b: CandidateRank) =>
  b.urgency - a.urgency || b.alignment - a.alignment || b.severity - a.severity || a.key.localeCompare(b.key)

const validHours = (hours: number | null | undefined): hours is number =>
  typeof hours === 'number' && Number.isFinite(hours) && hours >= 0

function weeklyExpectation(plan: DashboardPlano, weekDay: number) {
  const weekdays = plan?.horas_dias_semana
  const saturday = plan?.horas_sabado
  const sunday = plan?.horas_domingo
  if (validHours(weekdays) && validHours(saturday) && validHours(sunday)) {
    const total = weekdays * 5 + saturday + sunday
    if (total > 0) {
      const elapsed = Math.min(weekDay, 5) * weekdays + (weekDay >= 6 ? saturday : 0) + (weekDay === 7 ? sunday : 0)
      return { percent: elapsed / total * 100, configured: true }
    }
  }
  return { percent: weekDay / 7 * 100, configured: false }
}

function streak(sessions: SessaoDesempenho[], today: string) {
  const dates = [...new Set(sessions.filter(s => (s.duration_seconds ?? 0) > 0).map(dataDaSessao).filter((d): d is string => !!d))].sort().reverse()
  let best = 0, run = 0, previous: string | null = null
  for (const date of dates) {
    run = previous && somarDiasCivis(previous, -1) === date ? run + 1 : 1
    best = Math.max(best, run)
    previous = date
  }
  let current = 0
  let date = dates[0] === today ? today : somarDiasCivis(today, -1)
  const set = new Set(dates)
  while (set.has(date)) { current++; date = somarDiasCivis(date, -1) }
  return { current, best }
}

function durationFor(materiaId: string | undefined, sessions: SessaoDesempenho[], eventDuration: number | undefined, available: number | null) {
  if (available !== null && available < 5) return undefined
  const durations = sessions.filter(s => s.materia_id === materiaId && (s.duration_seconds ?? 0) >= 300)
    .map(s => (s.duration_seconds ?? 0) / 60)
  const base = eventDuration && eventDuration > 0 ? eventDuration
    : durations.length >= 3 ? Math.max(30, Math.min(60, median(durations))) : 45
  return roundFive(available === null ? base : Math.min(base, available))
}

function questionsFor(materiaId: string | undefined, sessions: SessaoDesempenho[], duration: number | undefined) {
  if (!materiaId || !duration) return undefined
  const rates = sessions.filter(s => s.materia_id === materiaId && (s.duration_seconds ?? 0) >= 300)
    .map(s => ({ minutes: (s.duration_seconds ?? 0) / 60, questions: resumirSessoes([s]).questoes }))
    .filter(s => s.questions > 0).map(s => s.questions / s.minutes)
  if (rates.length < 3) return undefined
  const estimate = median(rates) * duration
  return estimate >= 5 ? roundFive(estimate) : undefined
}

function reviewStep(erros: CadernoErro[], materiaNames: Map<string, string>, overdue: boolean): DashboardStep {
  const groups = new Map<string, CadernoErro[]>()
  for (const erro of erros) {
    const key = `${erro.materia_id}:${erro.assunto_id || erro.assunto_texto || ''}`
    groups.set(key, [...(groups.get(key) || []), erro])
  }
  const top = [...groups.values()].sort((a, b) => b.length - a.length)[0]
  const focused = top && assuntoDoErro(top[0]) !== 'Assunto não informado' &&
    (erros.length === 1 || (top.length >= 2 && top.length / erros.length >= 0.5))
  const materialCount = new Set(erros.map(e => e.materia_id)).size
  const title = focused ? `Revise ${assuntoDoErro(top[0])}` : 'Faça suas revisões pendentes'
  const reason = focused
    ? `Você tem ${top.length} ${top.length === 1 ? 'erro' : 'erros'} de ${assuntoDoErro(top[0])} aguardando revisão${top.length < erros.length ? `, além de ${erros.length - top.length} em outros assuntos` : ''}${overdue ? ', incluindo revisão vencida' : ''}.`
    : `Você tem ${erros.length} ${erros.length === 1 ? 'erro' : 'erros'} aguardando revisão em ${materialCount} ${materialCount === 1 ? 'matéria' : 'matérias'}${overdue ? ', incluindo revisão vencida' : ''}.`
  return { kind: 'review', title, subtitle: focused ? materiaNames.get(top[0].materia_id) : undefined,
    reason, href: reviewUrl, cta: 'Abrir revisões' }
}

export function buildDashboard(input: DashboardInput): DashboardOutput {
  const { today, materias, assuntos, plan, examGoal } = input
  const sessions = input.sessions.filter(s => dentro(dataDaSessao(s), null, today))
  const events = input.events.filter(e => e.event_date === today).sort((a, b) => a.time.localeCompare(b.time))
  const errors = input.erros.filter(e => !e.deleted_at)
  const materiaNames = new Map(materias.map(m => [m.id, m.name]))
  const dayOfWeek = new Date(`${today}T12:00:00Z`).getUTCDay()
  const weekDay = dayOfWeek || 7
  const weekStart = somarDiasCivis(today, 1 - weekDay)
  const expectedWeek = weeklyExpectation(plan, weekDay)
  const todaySummary = resumirSessoes(sessions.filter(s => dataDaSessao(s) === today))
  const availabilityHours = plan ? (dayOfWeek === 0 ? plan.horas_domingo : dayOfWeek === 6 ? plan.horas_sabado : plan.horas_dias_semana) : null
  const todayGoal = validHours(availabilityHours) ? availabilityHours : null
  const available = todayGoal === null ? null
    : Math.max(0, Math.round(todayGoal * 60) - Math.round(todaySummary.segundos / 60))
  const scheduledRemaining = events.filter(e => !e.is_done).reduce((sum, e) => sum + Math.max(0, e.duration || 0), 0)
  const freeForExtra = available === null ? null : Math.max(0, available - scheduledRemaining)
  const noSpaceForExtra = freeForExtra !== null && freeForExtra < 5

  const periods = {} as DashboardOutput['periods']
  for (const period of ['7', '14', '30', 'all'] as Periodo[]) {
    const limits = janela(period, today)
    const current = resumirSessoes(sessions.filter(s => dentro(dataDaSessao(s), limits.inicio, limits.fim)))
    const previous = limits.anteriorInicio && limits.anteriorFim
      ? resumirSessoes(sessions.filter(s => dentro(dataDaSessao(s), limits.anteriorInicio, limits.anteriorFim!))) : null
    periods[period] = { seconds: current.segundos, questions: current.questoes, sessions: current.sessoes,
      accuracy: current.precisao, evolution: previous ? diferencaPrecisao(current, previous) : null,
      previous: previous ? { seconds: previous.segundos, questions: previous.questoes, sessions: previous.sessoes } : null }
  }

  const currentWindow = janela('14', today)
  const currentSessions = sessions.filter(s => dentro(dataDaSessao(s), currentWindow.inicio, today))
  const previousSessions = sessions.filter(s => dentro(dataDaSessao(s), currentWindow.anteriorInicio, currentWindow.anteriorFim!))
  const allCurrent = resumirSessoes(currentSessions)
  const allPrevious = resumirSessoes(previousSessions)
  const overallDelta = diferencaPrecisao(allCurrent, allPrevious)
  const candidates: Candidate[] = []
  const insights: (DashboardInsight & { rank: number; key: string; confidence: EvidenceConfidence })[] = []
  const addInsight = (insight: DashboardInsight, rank: number, key: string) => insights.push({ ...insight, rank, key, confidence: 'sufficient' })

  const due = errors.filter(e => podeRevisar(e, today) && dadosRevisaoCompletos(e))
  const overdue = due.filter(e => !!e.proxima_revisao && e.proxima_revisao < today)
  const dueToday = due.filter(e => !e.proxima_revisao || e.proxima_revisao === today)
  if (overdue.length) {
    const overdueStep = reviewStep(overdue, materiaNames, true)
    candidates.push({ step: { ...overdueStep,
      reason: `${overdueStep.reason}${dueToday.length ? ` Há também ${dueToday.length} ${dueToday.length === 1 ? 'revisão prevista' : 'revisões previstas'} para hoje.` : ''}` },
      urgency: 4, severity: overdue.length + due.length, alignment: 0, key: 'review-overdue', confidence: 'sufficient' })
  } else if (dueToday.length) candidates.push({ step: reviewStep(dueToday, materiaNames, false),
    urgency: dueToday.length >= 2 || dueToday.some(e => (e.erros_recorrentes_count ?? 0) >= 2) ? 3 : 1,
    severity: dueToday.length, alignment: 0, key: 'review-today', confidence: 'sufficient' })

  const weekSessions = sessions.filter(s => dentro(dataDaSessao(s), weekStart, today))
  const nextEvent = events.find(e => !e.is_done)
  const subjects: Omit<DashboardSubject, 'priority' | 'signal'>[] = []
  const moderateSubjects: (CandidateRank & { subjectId: string; signal: DashboardSubject['signal'] })[] = []
  const difficulty = new Map<string, { severity: number; reason: string; assuntoId?: string }>()
  for (const materia of materias) {
    const currentMatterSessions = currentSessions.filter(s => s.materia_id === materia.id)
    const previousMatterSessions = previousSessions.filter(s => s.materia_id === materia.id)
    const current = resumirSessoes(currentMatterSessions)
    const previous = resumirSessoes(previousMatterSessions)
    const delta = diferencaPrecisao(current, previous)
    const goal = Math.max(0, materia.goal_hours ?? 0)
    const weeklySeconds = resumirSessoes(weekSessions.filter(s => s.materia_id === materia.id)).segundos
    const progress = goal > 0 ? Math.min(100, Math.round(weeklySeconds / (goal * 3600) * 100)) : null
    const matterErrors = errors.filter(e => e.materia_id === materia.id && e.estado === 'ativo')
    const repeated = matterErrors.some(e => (e.erros_recorrentes_count ?? 0) >= 2)
    const precisionConfidence = current.questoes >= AMOSTRA_MINIMA_PRECISAO ? 'sufficient' : 'insufficient'
    const lowAccuracy = precisionConfidence === 'sufficient' && current.precisao !== null && current.precisao < 60
    const strongDrop = delta !== null && delta <= -10
    if (precisionConfidence === 'insufficient' && current.precisao !== null && current.precisao < 60) {
      candidates.push({ step: { kind: 'difficulty', title: `Pratique ${materia.name}`,
        reason: `${current.questoes} questões não bastam para avaliar uma dificuldade em ${materia.name}.`,
        href: timerUrl(materia.id), cta: 'Abrir Timer' }, urgency: 2, severity: 0, alignment: 0,
        key: `insufficient:${materia.id}`, subjectId: materia.id, confidence: 'insufficient' })
    }
    if (lowAccuracy || strongDrop) {
      const topicSummaries = assuntosDaMateria(currentMatterSessions, assuntos, materia.id).itens
      const topic = topicSummaries.filter(a => a.questoes >= AMOSTRA_MINIMA_PRECISAO && a.precisao !== null && a.precisao < 60)
        .sort((a, b) => a.precisao! - b.precisao!)[0]
      const errorTopics = new Map<string, CadernoErro[]>()
      for (const e of matterErrors.filter(e => e.assunto_id)) errorTopics.set(e.assunto_id!, [...(errorTopics.get(e.assunto_id!) || []), e])
      const errorTopic = [...errorTopics.values()]
        .filter(rows => rows.length >= 3 || rows.some(e => (e.erros_recorrentes_count ?? 0) >= 2))
        .sort((a, b) => b.length - a.length || Math.max(...b.map(e => e.erros_recorrentes_count ?? 0)) - Math.max(...a.map(e => e.erros_recorrentes_count ?? 0)))[0]?.[0]
      const chosenTopic = topic || (errorTopic && assuntos.find(a => a.id === errorTopic.assunto_id && a.materia_id === materia.id))
      const reason = lowAccuracy
        ? `Em ${current.questoes} questões recentes de ${materia.name}, sua precisão foi ${current.precisao}%.`
        : `Sua precisão em ${materia.name} caiu ${Math.abs(delta!)} p.p. entre dois períodos com pelo menos 20 questões cada.`
      difficulty.set(materia.id, { severity: (current.precisao !== null && current.precisao < 50 ? 3 : 2) + (repeated ? 1 : 0),
        reason, assuntoId: chosenTopic?.id })
      if (lowAccuracy) {
        const pattern = analisarPadroesErros(matterErrors.map(e => ({ ...e, assuntos: e.assuntos || null })), [materia])
        if (pattern?.motivo) addInsight({ family: 'erros', title: `${materia.name}: possível padrão`,
          message: `${pattern.motivo.nome} pode estar pesando em ${materia.name}. A precisão recente foi ${current.precisao}% em ${current.questoes} questões, e ${pattern.motivo.nome.toLowerCase()} aparece em ${pattern.motivo.quantidade} de ${pattern.total} erros ativos registrados no Caderno.`,
          tone: 'neutral' }, 4, `pattern:${materia.id}`)
      }
      const duration = durationFor(materia.id, sessions, undefined, freeForExtra)
      candidates.push({ step: { kind: 'difficulty', title: `Pratique ${chosenTopic?.name || materia.name}`,
        subtitle: chosenTopic ? materia.name : undefined, reason: `${reason} Uma sessão de questões pode ajudar a verificar o que precisa de revisão.`,
        href: timerUrl(materia.id, chosenTopic?.id), cta: 'Abrir Timer', duration,
        questions: questionsFor(materia.id, sessions, duration) },
        urgency: strongDrop && repeated || current.precisao !== null && current.precisao < 50 ? 3 : 2,
        severity: difficulty.get(materia.id)!.severity, alignment: nextEvent?.subject_id === materia.id ? 2 : 0,
        key: `difficulty:${materia.id}`, subjectId: materia.id, signal: lowAccuracy ? 'accuracy' : 'drop', confidence: 'sufficient' })
    } else if (current.questoes >= AMOSTRA_MINIMA_PRECISAO && current.precisao !== null && current.precisao < 70) {
      addInsight({ family: 'aprendizado', title: `${materia.name} em observação`,
        message: `Nas últimas duas semanas, você acertou ${current.precisao}% de ${current.questoes} questões de ${materia.name}.`, tone: 'neutral' }, 2, `moderate:${materia.id}`)
      moderateSubjects.push({ subjectId: materia.id, signal: 'accuracyModerate', urgency: 0,
        severity: 70 - current.precisao, alignment: nextEvent?.subject_id === materia.id ? 2 : 0, key: `moderate:${materia.id}` })
    }
    if (delta !== null && delta <= -5 && delta > -10) addInsight({ family: 'aprendizado', title: `Precisão em ${materia.name}`,
      message: `A precisão caiu ${Math.abs(delta)} p.p. em relação às duas semanas anteriores.`, tone: 'attention' }, 2, `drop:${materia.id}`)

    const matterSessions = sessions.filter(s => s.materia_id === materia.id)
    const last = matterSessions.map(dataDaSessao).filter((d): d is string => !!d).sort().at(-1)
    const created = materia.created_at ? new Date(materia.created_at) : null
    const createdDate = created && !Number.isNaN(created.getTime()) ? dataTimestampBrasil(materia.created_at!) : null
    const ageDays = createdDate ? Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${createdDate}T12:00:00Z`)) / 86400000) : null
    // Só há histórico suficiente para negligência se a matéria já existia antes desta semana
    // e há estudo anterior registrado. Sem ambos, não inferimos perda de ritmo.
    const planMature = goal > 0 && ageDays !== null && ageDays >= 7
    const established = planMature && !!last && matterSessions.some(s => {
      const date = dataDaSessao(s)
      return date !== null && date < weekStart
    })
    const daysSince = last ? Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${last}T12:00:00Z`)) / 86400000) : null
    if (established && weeklySeconds === 0 && (weekDay >= 4 || (daysSince !== null && daysSince >= 7))) {
      const duration = durationFor(materia.id, sessions, undefined, freeForExtra)
      candidates.push({ step: { kind: 'neglect', title: `Retome ${materia.name}`,
        reason: `${materia.name} tem meta semanal de ${goal}h, não teve estudo registrado nesta semana e saiu do seu ritmo recente.`,
        href: timerUrl(materia.id), cta: 'Abrir Timer', duration, questions: questionsFor(materia.id, sessions, duration) },
        urgency: daysSince !== null && daysSince >= 7 ? 2 : 1, severity: daysSince || 0,
        alignment: nextEvent?.subject_id === materia.id ? 2 : 0, key: `neglect:${materia.id}`, subjectId: materia.id,
        signal: 'rhythm', confidence: 'sufficient' })
    }
    if (goal > 0 && weekDay >= 3 && sessions.length > 0) {
      const expected = expectedWeek.percent
      const gap = expected - Math.min(100, weeklySeconds / (goal * 3600) * 100)
      if (gap >= 35 && weekDay >= 4 && planMature && expectedWeek.configured) {
        const duration = durationFor(materia.id, sessions, undefined, freeForExtra)
        candidates.push({ step: { kind: 'deficit', title: `Avance em ${materia.name}`,
          reason: `Você cumpriu ${progress}% da meta semanal de ${materia.name}; pelo andamento da semana, o esperado seria cerca de ${Math.round(expected)}%.`,
          href: timerUrl(materia.id), cta: 'Abrir Timer', duration, questions: questionsFor(materia.id, sessions, duration) },
          urgency: 1, severity: Math.round(gap), alignment: nextEvent?.subject_id === materia.id ? 2 : 0,
          key: `deficit:${materia.id}`, subjectId: materia.id, signal: 'planning', confidence: 'sufficient' })
      } else if (gap >= 20 && planMature) addInsight({ family: 'planejamento', title: `Meta de ${materia.name}`,
        message: expectedWeek.configured
          ? `Você cumpriu ${progress}% da meta semanal; pela disponibilidade que configurou, a referência até hoje é cerca de ${Math.round(expected)}%.`
          : `Você cumpriu ${progress}% da meta semanal; sem disponibilidade configurada, a referência uniforme da semana é cerca de ${Math.round(expected)}%.`,
        tone: 'neutral' }, 1, `gap:${materia.id}`)
    }
    subjects.push({ id: materia.id, name: materia.name, weeklyGoal: goal, weeklyStudiedSeconds: weeklySeconds, progress })
  }

  if (nextEvent) {
    const matter = nextEvent.subject_id ? materiaNames.get(nextEvent.subject_id) : null
    const aligned = nextEvent.subject_id ? difficulty.get(nextEvent.subject_id) : null
    const late = nextEvent.time < input.time
    const duration = durationFor(nextEvent.subject_id || undefined, sessions, nextEvent.duration, available)
    const topicId = nextEvent.activity_type === 'Estudo' ? aligned?.assuntoId : undefined
    const href = nextEvent.activity_type === 'Estudo' && nextEvent.subject_id
      ? timerUrl(nextEvent.subject_id, topicId) : '/painel/calendario'
    const reason = `Você planejou ${nextEvent.title} para hoje às ${nextEvent.time.slice(0, 5)}${late ? ' e ainda não marcou a atividade como concluída' : ''}.`
    candidates.push({ step: { kind: 'calendar', title: nextEvent.title, subtitle: matter || undefined,
      reason: aligned ? `${reason} O plano coincide com um sinal real: ${aligned.reason}` : reason,
      href, cta: href.startsWith('/painel/timer') ? 'Abrir Timer' : 'Ver no Calendário', duration,
      questions: nextEvent.activity_type === 'Estudo' ? questionsFor(nextEvent.subject_id || undefined, sessions, duration) : undefined },
      urgency: aligned ? 3 : 2, severity: aligned?.severity || 0, alignment: 3,
      key: `calendar:${nextEvent.id}`, subjectId: nextEvent.subject_id || undefined, confidence: 'sufficient' })
    if (aligned) addInsight({ family: 'planejamento', title: 'Seu plano está alinhado',
      message: `${nextEvent.title} já está no calendário e coincide com uma dificuldade observada em ${matter}.`, tone: 'positive' }, 3, 'alignment')
  }

  if (overallDelta !== null) {
    if (overallDelta >= 5) addInsight({ family: 'aprendizado', title: 'Precisão em melhora',
      message: `Sua precisão subiu ${overallDelta} p.p. em relação às duas semanas anteriores, com ${allCurrent.questoes} questões recentes.`, tone: 'positive' }, 3, 'improvement')
    else if (overallDelta <= -5) addInsight({ family: 'aprendizado', title: 'Precisão em queda',
      message: `Sua precisão caiu ${Math.abs(overallDelta)} p.p. em relação às duas semanas anteriores, com ${allCurrent.questoes} questões recentes.`, tone: 'attention' }, 2, 'overall-drop')
    else addInsight({ family: 'aprendizado', title: 'Precisão estável',
      message: `Sua precisão ficou próxima da anterior (${allCurrent.precisao}% nas últimas duas semanas), com ${allCurrent.questoes} questões recentes.`, tone: 'positive' }, 1, 'stable')
  }
  if (allCurrent.questoes >= 20 && allPrevious.questoes >= 20 && allCurrent.questoes >= allPrevious.questoes * 1.2 && overallDelta !== null && overallDelta >= -4) {
    addInsight({ family: 'pratica', title: 'Mais prática, precisão preservada',
      message: `Você respondeu ${allCurrent.questoes} questões nas últimas duas semanas, ante ${allPrevious.questoes} nas duas anteriores, sem queda relevante de precisão.`, tone: 'positive' }, 4, 'volume-accuracy')
  }
  if (allCurrent.sessoes >= 3 && allPrevious.sessoes >= 3 && allPrevious.segundos > 0 && allCurrent.segundos >= allPrevious.segundos * 1.2) {
    addInsight({ family: 'ritmo', title: 'Mais tempo registrado',
      message: `Você registrou ${formatarTempo(allCurrent.segundos)} de estudo nas últimas duas semanas, ante ${formatarTempo(allPrevious.segundos)} nas duas anteriores.`,
      tone: 'neutral' }, 1, 'more-time')
  }
  const resolvedRecently = errors.filter(e => e.estado === 'resolvido' && e.resolvido_em && dentro(dataTimestampBrasil(e.resolvido_em), currentWindow.inicio, today)).length
  if (resolvedRecently >= 2) addInsight({ family: 'conquista', title: 'Revisões concluídas',
    message: `Você resolveu ${resolvedRecently} erros do Caderno nas últimas duas semanas.`, tone: 'positive' }, 2, 'resolved')
  const recurring = errors.filter(e => e.estado === 'ativo' && (e.erros_recorrentes_count ?? 0) >= 2)
  if (recurring.length) addInsight({ family: 'erros', title: 'Conteúdo em revisão',
    message: `${recurring.length} ${recurring.length === 1 ? 'questão teve' : 'questões tiveram'} pelo menos duas falhas de revisão registradas no Caderno.`, tone: 'neutral' }, 2, 'recurring')

  const subjectLabels: Record<DashboardSubject['signal'], string> = {
    accuracy: 'Precisão para acompanhar', accuracyModerate: 'Precisão em observação',
    drop: 'Queda recente', rhythm: 'Fora do ritmo', planning: 'Abaixo da meta',
  }
  const subjectById = new Map(subjects.map(subject => [subject.id, subject]))
  const rankedSubjects = new Map<string, DashboardSubject>()
  const subjectSignals = [...candidates.filter(c => c.confidence === 'sufficient' && c.subjectId && c.signal), ...moderateSubjects]
  for (const candidate of subjectSignals.sort(compareCandidates)) {
    if (!candidate.subjectId || !candidate.signal || rankedSubjects.has(candidate.subjectId)) continue
    const subject = subjectById.get(candidate.subjectId)
    if (subject) rankedSubjects.set(candidate.subjectId, { ...subject, signal: candidate.signal,
      priority: subjectLabels[candidate.signal] })
  }
  const eligible = candidates.filter(candidate => candidate.confidence === 'sufficient' &&
    (!noSpaceForExtra || !['difficulty', 'neglect', 'deficit'].includes(candidate.step.kind)))
  eligible.sort(compareCandidates)
  const selected = eligible[0]
  const recordedSessions = sessions.filter(s => (s.duration_seconds ?? 0) >= 300 && dataDaSessao(s))
  const recordedDays = new Set(recordedSessions.map(dataDaSessao)).size
  const maturity: DashboardOutput['maturity'] = sessions.length === 0 && errors.length === 0 && events.length === 0 ? 'new'
    : recordedSessions.length >= 5 && recordedDays >= 3 ? 'ready' : 'learning'
  const fallback: DashboardStep = maturity === 'new' ? { kind: 'first', title: 'Comece seu primeiro estudo',
    reason: 'Registre uma sessão para o Revyza começar a entender sua preparação.', href: materias.length ? '/painel/timer' : '/painel/materias',
    cta: materias.length ? 'Abrir Timer' : 'Adicionar matéria' }
    : { kind: 'maintenance', title: noSpaceForExtra ? 'Nenhuma prioridade extra para hoje'
      : maturity === 'learning' ? 'Estamos conhecendo seu ritmo' : 'Seus estudos estão em ordem',
      reason: noSpaceForExtra ? 'A disponibilidade configurada para hoje já está ocupada. Organize o próximo estudo no Calendário.'
        : maturity === 'learning' ? 'Continue registrando seus estudos. Ainda estamos conhecendo seu ritmo; cada sinal aparece quando há dados suficientes.'
          : 'Não encontramos nenhuma prioridade especial nos seus dados agora. Continue seu planejamento ou escolha o próximo estudo.',
      href: noSpaceForExtra ? '/painel/calendario' : '/painel/timer', cta: noSpaceForExtra ? 'Ver calendário' : 'Começar estudo' }
  const recommendation = selected?.step ? { ...selected.step } : fallback
  if (selected && nextEvent && selected.step.kind !== 'calendar' && selected.urgency >= 3) {
    recommendation.reason += ` Antes da atividade ${nextEvent.title}, cuide desta prioridade; depois, continue seu planejamento.`
  }
  if (selected?.key === 'review-overdue' || selected?.key === 'review-today') {
    const i = insights.findIndex(insight => insight.key === 'recurring')
    if (i >= 0) insights.splice(i, 1)
  }
  if (selected?.step.kind === 'difficulty') {
    for (let i = insights.length - 1; i >= 0; i--) if (insights[i].key === 'overall-drop' || insights[i].key === `moderate:${selected.subjectId}`) insights.splice(i, 1)
  }
  if (selected?.step.kind === 'calendar') {
    const i = insights.findIndex(insight => insight.key === 'alignment')
    if (i >= 0) insights.splice(i, 1)
  }
  if (insights.some(insight => insight.key === 'volume-accuracy')) {
    for (let i = insights.length - 1; i >= 0; i--) if (insights[i].key === 'stable' || insights[i].key === 'improvement') insights.splice(i, 1)
  }
  insights.sort((a, b) => b.rank - a.rank || a.key.localeCompare(b.key))
  const seen = new Set<DashboardInsight['family']>()
  const selectedInsights: DashboardInsight[] = []
  for (const insight of insights) {
    if (insight.confidence === 'insufficient') continue
    if (seen.has(insight.family)) continue
    seen.add(insight.family)
    selectedInsights.push({ family: insight.family, title: insight.title, message: insight.message, tone: insight.tone })
    if (selectedInsights.length === 2) break
  }
  return { maturity, today: { seconds: todaySummary.segundos, goal: todayGoal,
    progress: todayGoal !== null && todayGoal > 0 ? Math.min(100, Math.round(todaySummary.segundos / (todayGoal * 3600) * 100)) : null },
    streak: streak(sessions, today), recommendation, insights: selectedInsights, periods,
    subjects: [...rankedSubjects.values()].slice(0, 3), materias: materias.map(m => ({ id: m.id, name: m.name })), events, examGoal }
}
