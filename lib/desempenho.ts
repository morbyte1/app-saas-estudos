// Todas as janelas usam datas civis de America/Sao_Paulo, incluindo hoje.
export type Periodo = '7' | '14' | '30' | 'all'
export type SessaoDesempenho = {
  session_date: string | null
  created_at: string | null
  duration_seconds: number | null
  questions_total: number | null
  questions_done: number | null // O Timer grava aqui os acertos, não o total.
  questions_wrong: number | null
  materia_id: string | null
}
export type ErroDesempenho = {
  materia_id: string | null
  assunto_id: string | null
  assunto_texto: string | null
  motivo_erro: string | null
  estado: string | null
  erros_recorrentes_count: number | null
  created_at: string
  assuntos: { name: string } | null
}
export type Resumo = { segundos: number; questoes: number; erradas: number; sessoes: number; precisao: number | null }
export type Ponto = { label: string; questoes: number; segundos: number; precisao: number | null }
// Com menos de 20 questões por janela, uma única questão muda a precisão em mais de 5 p.p.
export const AMOSTRA_MINIMA_PRECISAO = 20

const tz = 'America/Sao_Paulo'
export const dataBrasil = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(date)
export const dataTimestampBrasil = (value: string) => dataBrasil(new Date(value))
export const somarDiasCivis = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
export const janela = (periodo: Periodo, hoje = dataBrasil()) => {
  if (periodo === 'all') return { inicio: null, fim: hoje, anteriorInicio: null, anteriorFim: null }
  const dias = Number(periodo)
  const inicio = somarDiasCivis(hoje, 1 - dias)
  return { inicio, fim: hoje, anteriorInicio: somarDiasCivis(inicio, -dias), anteriorFim: somarDiasCivis(inicio, -1) }
}
export const dataDaSessao = (s: SessaoDesempenho) => s.session_date || (s.created_at ? dataTimestampBrasil(s.created_at) : null)
export const dentro = (date: string | null, inicio: string | null, fim: string) => !!date && (!inicio || date >= inicio) && date <= fim

export function questoesDaSessao(s: Pick<SessaoDesempenho, 'questions_total' | 'questions_done' | 'questions_wrong'>) {
  // Em legados sem total, questions_done + questions_wrong reconstitui o total.
  const total = s.questions_total ?? ((s.questions_done ?? 0) + (s.questions_wrong ?? 0))
  const erradas = s.questions_wrong ?? 0
  if (!Number.isFinite(total) || !Number.isFinite(erradas) || total < 0 || erradas < 0 || erradas > total) return { total: 0, erradas: 0 }
  return { total, erradas }
}
export const precisao = (questoes: number, erradas: number) => questoes > 0 ? Math.round(((questoes - erradas) / questoes) * 100) : null
export const diferencaPrecisao = (atual: Resumo, anterior: Resumo) =>
  atual.questoes >= AMOSTRA_MINIMA_PRECISAO && anterior.questoes >= AMOSTRA_MINIMA_PRECISAO && atual.precisao !== null && anterior.precisao !== null
    ? atual.precisao - anterior.precisao : null

export function resumirSessoes(sessoes: SessaoDesempenho[]): Resumo {
  let segundos = 0, questoes = 0, erradas = 0
  for (const s of sessoes) {
    segundos += Math.max(0, s.duration_seconds ?? 0)
    const q = questoesDaSessao(s)
    questoes += q.total
    erradas += q.erradas
  }
  return { segundos, questoes, erradas, sessoes: sessoes.length, precisao: precisao(questoes, erradas) }
}
export const formatarTempo = (segundos: number) => {
  const minutos = Math.round(Math.abs(segundos) / 60)
  const horas = Math.floor(minutos / 60)
  return horas ? `${horas}h${String(minutos % 60).padStart(2, '0')}` : `${minutos}min`
}

export function pontosEvolucao(sessoes: SessaoDesempenho[], periodo: Periodo, inicio: string | null, fim: string): Ponto[] {
  const porBucket = new Map<string, SessaoDesempenho[]>()
  const start = inicio || sessoes.map(dataDaSessao).filter((d): d is string => !!d).sort()[0]
  if (!start) return []
  // 7/14 dias: dia; 30 dias: blocos de 7 dias; todo período: mês.
  const bucket = (date: string) => {
    if (periodo === 'all') return date.slice(0, 7)
    if (periodo === '30') {
      const diff = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000)
      return somarDiasCivis(start, Math.floor(diff / 7) * 7)
    }
    return date
  }
  for (const s of sessoes) {
    const date = dataDaSessao(s)
    if (!date || !dentro(date, inicio, fim)) continue
    const key = bucket(date)
    const rows = porBucket.get(key) || []
    rows.push(s)
    porBucket.set(key, rows)
  }
  if (periodo === 'all') return [...porBucket].sort(([a], [b]) => a.localeCompare(b)).map(([key, rows]) => {
    const r = resumirSessoes(rows)
    return { label: key.slice(5) + '/' + key.slice(0, 4), questoes: r.questoes, segundos: r.segundos, precisao: r.precisao }
  })
  const keys: string[] = []
  for (let date = start; date <= fim; date = somarDiasCivis(date, periodo === '30' ? 7 : 1)) keys.push(date)
  return keys.map(key => {
    const r = resumirSessoes(porBucket.get(key) || [])
    return { label: `${key.slice(8)}/${key.slice(5, 7)}`, questoes: r.questoes, segundos: r.segundos, precisao: r.precisao }
  })
}

export function padroesErros(erros: ErroDesempenho[], materias: { id: string; name: string }[]) {
  if (erros.length < 5) return []
  const result: string[] = []
  const nomes = new Map(materias.map(m => [m.id, m.name]))
  const porMotivo = new Map<string, number>()
  const porMateria = new Map<string, number>()
  const porAssunto = new Map<string, { name: string; count: number }>()
  for (const e of erros) {
    if (e.motivo_erro) porMotivo.set(e.motivo_erro, (porMotivo.get(e.motivo_erro) || 0) + 1)
    if (e.materia_id) porMateria.set(e.materia_id, (porMateria.get(e.materia_id) || 0) + 1)
    const assunto = e.assunto_texto || e.assuntos?.name
    if (assunto) {
      const key = `${e.materia_id || ''}:${e.assunto_id || assunto}`
      const previous = porAssunto.get(key)
      porAssunto.set(key, { name: assunto, count: (previous?.count || 0) + 1 })
    }
  }
  const principal = [...porMotivo].sort((a, b) => b[1] - a[1])[0]
  if (principal && principal[1] >= 3 && principal[1] / erros.length >= 0.4)
    result.push(`${principal[0]} aparece em ${principal[1]} dos ${erros.length} erros registrados no Caderno.`)
  const assunto = [...porAssunto.values()].sort((a, b) => b.count - a.count)[0]
  if (assunto && assunto.count >= 3 && assunto.count / erros.length >= 0.4)
    result.push(`${assunto.count} dos ${erros.length} erros registrados estão no assunto ${assunto.name}.`)
  else {
    const materia = [...porMateria].sort((a, b) => b[1] - a[1])[0]
    if (materia && materia[1] >= 3 && materia[1] / erros.length >= 0.4)
      result.push(`${materia[1]} dos ${erros.length} erros registrados estão em ${nomes.get(materia[0]) || 'uma matéria'}.`)
  }
  const recorrentes = erros.filter(e => (e.erros_recorrentes_count || 0) > 0).length
  if (recorrentes >= 3 && recorrentes / erros.length >= 0.4)
    result.push(`${recorrentes} dos ${erros.length} erros registrados tiveram pelo menos uma falha em revisão.`)
  return result.slice(0, 3)
}
