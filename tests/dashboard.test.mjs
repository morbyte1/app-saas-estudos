import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboard } from '../lib/dashboard.ts'

const today = '2026-09-17' // quinta-feira
const materia = (goal_hours = 0, created_at = '2026-08-01T12:00:00Z') => ({ id: 'm1', name: 'Matemática', goal_hours, created_at })
const session = (date, questions_total = 0, questions_wrong = 0, assunto_id = null, duration_seconds = 2700) => ({
  session_date: date, created_at: `${date}T12:00:00Z`, duration_seconds,
  questions_total, questions_done: questions_total - questions_wrong, questions_wrong,
  materia_id: 'm1', assunto_id,
})
const event = (time = '15:00', duration = 45) => ({ id: 'e1', title: 'Estudar Matemática', event_date: today,
  time, duration, subject_id: 'm1', activity_type: 'Estudo', is_done: false })
const erro = (id, proxima_revisao, changes = {}) => ({
  id, materia_id: 'm1', assunto_id: 'a1', assunto_texto: 'Funções', motivo_erro: 'Interpretação',
  motivo_erro_original: 'Interpretação', origem_questao: null, deleted_at: null,
  enunciado: 'Questão', resposta_correta: 'Resolução', confianca: null,
  created_at: '2026-09-01T12:00:00Z', status: 'revisar', estado: 'ativo', nivel_revisao: 0,
  proxima_revisao, erros_recorrentes_count: 0, resolvido_em: null, assuntos: { name: 'Funções' }, ...changes,
})
const input = (changes = {}) => ({ today, time: '12:00', sessions: [], materias: [materia()],
  assuntos: [{ id: 'a1', name: 'Funções', materia_id: 'm1' }], erros: [], events: [], plan: null,
  dailyGoal: null, examGoal: null, ...changes })

test('sem dados orienta primeiro estudo sem inventar insight', () => {
  const out = buildDashboard(input())
  assert.equal(out.maturity, 'new')
  assert.equal(out.recommendation.kind, 'first')
  assert.deepEqual(out.insights, [])
  assert.equal(out.periods['7'].accuracy, null)
})

test('amostra pequena mostra fatos, sem diagnosticar precisão baixa', () => {
  const out = buildDashboard(input({ sessions: [session(today, 19, 12)] }))
  assert.equal(out.maturity, 'learning')
  assert.equal(out.recommendation.kind, 'maintenance')
  assert.equal(out.periods['7'].questions, 19)
  assert.equal(out.periods['7'].evolution, null)
})

test('dados suficientes e estáveis aceitam nenhuma prioridade especial', () => {
  const out = buildDashboard(input({ sessions: [session(today, 20, 4), session('2026-09-03', 20, 4)] }))
  assert.equal(out.maturity, 'ready')
  assert.equal(out.recommendation.kind, 'maintenance')
  assert.ok(out.insights.some(i => i.title === 'Precisão estável'))
})

test('revisão vencida supera calendário e explica a interrupção', () => {
  const out = buildDashboard(input({ events: [event()], erros: [erro('r1', '2026-09-16')] }))
  assert.equal(out.recommendation.kind, 'review')
  assert.match(out.recommendation.reason, /Antes da atividade Estudar Matemática/)
  assert.equal(out.recommendation.href, '/painel/caderno?area=revisoes')
})

test('uma revisão de hoje não supera plano; duas revisões podem ser ação sem plano', () => {
  const one = buildDashboard(input({ events: [event()], erros: [erro('r1', today)] }))
  assert.equal(one.recommendation.kind, 'calendar')
  const two = buildDashboard(input({ erros: [erro('r1', today), erro('r2', today)] }))
  assert.equal(two.recommendation.kind, 'review')
  assert.match(two.recommendation.title, /Funções/)
  const twoWithRoutinePlan = buildDashboard(input({ events: [event()], erros: [erro('r1', today), erro('r2', today)] }))
  assert.equal(twoWithRoutinePlan.recommendation.kind, 'review')
  assert.match(twoWithRoutinePlan.recommendation.reason, /continue seu planejamento/)
  const future = buildDashboard(input({ erros: [erro('r3', '2026-09-18')] }))
  assert.equal(future.recommendation.kind, 'maintenance')
})

test('precisão baixa exige 20 questões; assunto também exige evidência própria', () => {
  const low = buildDashboard(input({ sessions: [session(today, 20, 9, 'a1')] }))
  assert.equal(low.recommendation.kind, 'difficulty')
  assert.match(low.recommendation.href, /assuntoId=a1/)
  const sparseTopic = buildDashboard(input({ sessions: [session(today, 10, 5, 'a1'), session(today, 10, 4)] }))
  assert.equal(sparseTopic.recommendation.kind, 'difficulty')
  assert.doesNotMatch(sparseTopic.recommendation.href, /assuntoId=/)
})

test('plano alinhado a dificuldade é favorecido; revisão vencida ainda supera ambos', () => {
  const sessions = [session(today, 20, 9)]
  const errors = [erro('r1', today), erro('r2', today)]
  const aligned = buildDashboard(input({ sessions, events: [event()], erros: errors }))
  assert.equal(aligned.recommendation.kind, 'calendar')
  assert.match(aligned.recommendation.reason, /coincide com um sinal real/)
  const urgent = buildDashboard(input({ sessions, events: [event()], erros: [...errors, erro('r3', '2026-09-16')] }))
  assert.equal(urgent.recommendation.kind, 'review')
})

test('matéria recente não recebe negligência; histórico estabelecido pode gerar retomada', () => {
  const previous = session('2026-09-07', 0, 0)
  const recent = buildDashboard(input({ materias: [materia(5, '2026-09-15T12:00:00Z')] }))
  assert.notEqual(recent.recommendation.kind, 'neglect')
  const established = buildDashboard(input({ materias: [materia(5)], sessions: [previous] }))
  assert.equal(established.recommendation.kind, 'neglect')
})

test('meta antiga sem qualquer atividade não transforma usuário novo em atrasado', () => {
  const out = buildDashboard(input({ materias: [materia(5)] }))
  assert.equal(out.recommendation.kind, 'first')
})

test('déficit só vira candidato depois da metade da semana e com histórico real', () => {
  const sessions = [session(today, 0, 0, null, 1200)]
  const thursday = buildDashboard(input({ materias: [materia(5)], sessions }))
  assert.equal(thursday.recommendation.kind, 'deficit')
  const monday = buildDashboard(input({ today: '2026-09-14', materias: [materia(5)], sessions: [session('2026-09-14', 0, 0, null, 1200)] }))
  assert.notEqual(monday.recommendation.kind, 'deficit')
})

test('duração e questões usam mediana de três sessões válidas', () => {
  const sessions = [session('2026-09-10', 16, 2, null, 2400), session('2026-09-11', 20, 3, null, 3000), session('2026-09-12', 24, 4, null, 3600)]
  const out = buildDashboard(input({ sessions, events: [event('15:00', 50)] }))
  assert.equal(out.recommendation.duration, 50)
  assert.equal(out.recommendation.questions, 20)
  const sparse = buildDashboard(input({ sessions: sessions.slice(0, 2), events: [event()] }))
  assert.equal(sparse.recommendation.questions, undefined)
})

test('cruzamento de precisão e Caderno exige padrão, usa linguagem cautelosa', () => {
  const errors = [erro('1', '2026-10-01'), erro('2', '2026-10-01'), erro('3', '2026-10-01'),
    erro('4', '2026-10-01', { motivo_erro: 'Desatenção' }), erro('5', '2026-10-01', { motivo_erro: 'Desatenção' })]
  const out = buildDashboard(input({ sessions: [session(today, 21, 9)], erros: errors }))
  assert.ok(out.insights.some(i => i.family === 'erros' && i.message.includes('pode estar pesando')))
  assert.ok(out.insights.length <= 2)
})
