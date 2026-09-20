import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboard, formatarDataObjetivo, formatarDiferencaTempo } from '../lib/dashboard.ts'

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
  assert.notEqual(out.recommendation.title, 'Seus estudos estão em ordem')
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

test('maturidade geral não autoriza diagnóstico de precisão sem vinte questões', () => {
  const out = buildDashboard(input({ sessions: [session(today, 1, 1), session('2026-09-16', 1, 1), session('2026-09-15', 1, 1)] }))
  assert.equal(out.maturity, 'learning')
  assert.equal(out.recommendation.kind, 'maintenance')
  assert.equal(out.periods['7'].accuracy, 0)
  assert.equal(out.periods['7'].evolution, null)
  const established = buildDashboard(input({ sessions: [
    session(today, 1, 1), session('2026-09-16', 1, 1), session('2026-09-15', 1, 1),
    session('2026-09-14', 1, 1), session('2026-09-13', 1, 1),
  ] }))
  assert.equal(established.maturity, 'ready')
  assert.equal(established.recommendation.kind, 'maintenance')
  assert.deepEqual(established.subjects, [])
  assert.equal(established.periods['7'].evolution, null)
  const preciseButNew = buildDashboard(input({ sessions: [session(today, 20, 9)] }))
  assert.equal(preciseButNew.maturity, 'learning')
  assert.equal(preciseButNew.recommendation.kind, 'difficulty')
})

test('resumo expõe períodos anteriores iguais e sessões sem inventar comparação total', () => {
  const sessions = [
    session(today, 20, 4, null, 3600), session('2026-09-12', 10, 2, null, 1200),
    session('2026-09-11', 0, 0, null, 300), session('2026-09-10', 20, 8, null, 1800),
  ]
  const out = buildDashboard(input({ sessions }))
  assert.deepEqual(out.periods['7'], { seconds: 5100, questions: 30, sessions: 3, accuracy: 80,
    evolution: 20, previous: { seconds: 1800, questions: 20, sessions: 1 } })
  assert.equal(out.periods['14'].previous.questions, 0)
  assert.equal(out.periods['14'].evolution, null)
  assert.equal(out.periods.all.previous, null)
  assert.equal(out.periods.all.evolution, null)
})

test('janelas de 14 e 30 dias comparam com blocos imediatamente anteriores', () => {
  const out = buildDashboard(input({ sessions: [
    session(today, 10, 2), session('2026-09-03', 20, 4), session('2026-08-18', 15, 3),
  ] }))
  assert.equal(out.periods['14'].questions, 10)
  assert.equal(out.periods['14'].previous.questions, 20)
  assert.equal(out.periods['30'].questions, 30)
  assert.equal(out.periods['30'].previous.questions, 15)
})

test('tempo, questões e sessões comparam fatos mesmo sem precisão comparável', () => {
  const out = buildDashboard(input({ sessions: [session(today, 19, 7, null, 4200), session('2026-09-10', 20, 5, null, 2100)] }))
  assert.equal(out.periods['7'].seconds - out.periods['7'].previous.seconds, 2100)
  assert.equal(out.periods['7'].questions - out.periods['7'].previous.questions, -1)
  assert.equal(out.periods['7'].sessions - out.periods['7'].previous.sessions, 0)
  assert.equal(out.periods['7'].evolution, null)
  assert.equal(formatarDiferencaTempo(4320), '+1h 12min')
  assert.equal(formatarDiferencaTempo(-2100), '−35 min')
})

test('data civil do objetivo aceita data e timestamp sem deslocamento de fuso', () => {
  assert.equal(formatarDataObjetivo('2026-11-08'), '08/11/2026')
  assert.equal(formatarDataObjetivo('2026-11-08T13:00:00+00:00'), '08/11/2026')
  assert.equal(formatarDataObjetivo('2026-11-08T00:00:00Z'), '08/11/2026')
  assert.equal(formatarDataObjetivo('2026-02-30T13:00:00Z'), null)
})

test('dados suficientes e estáveis aceitam nenhuma prioridade especial', () => {
  const out = buildDashboard(input({ sessions: [
    session(today, 20, 4), session('2026-09-16'), session('2026-09-15'),
    session('2026-09-03', 20, 4), session('2026-09-02'),
  ] }))
  assert.equal(out.maturity, 'ready')
  assert.equal(out.recommendation.kind, 'maintenance')
  assert.equal(out.recommendation.title, 'Seus estudos estão em ordem')
  assert.equal(out.recommendation.href, '/painel/timer')
  assert.equal(out.recommendation.cta, 'Começar estudo')
  assert.ok(out.insights.some(i => i.title === 'Precisão estável'))
})

test('59% mantém ação forte; 60–69% permanece visível como atenção moderada', () => {
  const low = buildDashboard(input({ sessions: [session(today, 100, 41)] }))
  assert.equal(low.recommendation.kind, 'difficulty')
  assert.equal(low.subjects[0].priority, 'Precisão para acompanhar')
  const moderate60 = buildDashboard(input({ sessions: [session(today, 20, 8)] }))
  assert.equal(moderate60.recommendation.kind, 'maintenance')
  assert.equal(moderate60.subjects[0].priority, 'Precisão em observação')
  assert.ok(moderate60.insights.some(i => i.title === 'Matemática em observação'))
  const moderate69 = buildDashboard(input({ sessions: [session(today, 100, 31)] }))
  assert.equal(moderate69.recommendation.kind, 'maintenance')
  assert.equal(moderate69.subjects[0].signal, 'accuracyModerate')
  const sufficient70 = buildDashboard(input({ sessions: [session(today, 20, 6)] }))
  assert.deepEqual(sufficient70.subjects, [])
  const together = buildDashboard(input({ materias: [materia(), { ...materia(), id: 'm2', name: 'Física' }],
    sessions: [session(today, 20, 8), { ...session(today, 100, 41), materia_id: 'm2' }] }))
  assert.deepEqual(together.subjects.map(s => s.id), ['m2', 'm1'])
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

test('Caderno só especifica assunto com três erros ou recorrência forte', () => {
  const sessions = [session(today, 20, 9)]
  const two = buildDashboard(input({ sessions, erros: [erro('r1', '2026-10-01'), erro('r2', '2026-10-01')] }))
  assert.equal(two.recommendation.kind, 'difficulty')
  assert.doesNotMatch(two.recommendation.href, /assuntoId=/)
  const three = buildDashboard(input({ sessions, erros: [erro('r1', '2026-10-01'), erro('r2', '2026-10-01'), erro('r3', '2026-10-01')] }))
  assert.match(three.recommendation.href, /assuntoId=a1/)
  const recurrent = buildDashboard(input({ sessions, erros: [erro('r1', '2026-10-01', { erros_recorrentes_count: 2 })] }))
  assert.match(recurrent.recommendation.href, /assuntoId=a1/)
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

test('déficit usa a disponibilidade salva, preservando início da semana', () => {
  const sessions = [session(today, 0, 0, null, 1200)]
  const plan = { horas_dias_semana: 2, horas_sabado: 2, horas_domingo: 2 }
  const thursday = buildDashboard(input({ materias: [materia(5)], sessions, plan }))
  assert.equal(thursday.recommendation.kind, 'deficit')
  assert.match(thursday.recommendation.reason, /cerca de 57%/)
  const monday = buildDashboard(input({ today: '2026-09-14', materias: [materia(5)],
    sessions: [session('2026-09-14', 0, 0, null, 1200)], plan }))
  assert.notEqual(monday.recommendation.kind, 'deficit')
})

test('fim de semana concentrado reduz expectativa; sem disponibilidade não cria déficit forte', () => {
  const sessions = [session(today, 0, 0, null, 1200)]
  const weekend = buildDashboard(input({ materias: [materia(5)], sessions,
    plan: { horas_dias_semana: 1, horas_sabado: 5, horas_domingo: 5 } }))
  assert.notEqual(weekend.recommendation.kind, 'deficit')
  assert.deepEqual(weekend.subjects, [])
  assert.ok(weekend.insights.some(i => i.family === 'planejamento' && i.message.includes('cerca de 27%')))
  const unknown = buildDashboard(input({ materias: [materia(5)], sessions }))
  assert.notEqual(unknown.recommendation.kind, 'deficit')
  assert.ok(unknown.insights.some(i => i.family === 'planejamento' && i.message.includes('referência uniforme')))
})

test('matérias exibem o sinal real e são ordenadas por relevância antes do limite de três', () => {
  const m1 = { ...materia(5), id: 'm1', name: 'Química' }
  const m2 = { ...materia(), id: 'm2', name: 'Física' }
  const m3 = { ...materia(5), id: 'm3', name: 'História' }
  const m4 = { ...materia(), id: 'm4', name: 'Biologia' }
  const sessions = [
    session(today, 0, 0, null, 1200),
    { ...session(today, 20, 12), materia_id: 'm2' },
    { ...session('2026-09-07'), materia_id: 'm3' },
    { ...session(today, 20, 9), materia_id: 'm4' },
  ]
  const out = buildDashboard(input({ materias: [m1, m4, m3, m2], sessions }))
  assert.deepEqual(out.subjects.map(s => s.id), ['m2', 'm3', 'm4'])
  assert.deepEqual(out.subjects.map(s => s.priority), ['Precisão para acompanhar', 'Fora do ritmo', 'Precisão para acompanhar'])
  assert.deepEqual(out.subjects.map(s => s.signal), ['accuracy', 'rhythm', 'accuracy'])
  const drop = buildDashboard(input({ sessions: [session(today, 20, 4), session('2026-09-03', 20, 1)] }))
  assert.equal(drop.subjects[0].priority, 'Queda recente')
  const deficit = buildDashboard(input({ materias: [materia(5)], sessions: [session(today, 0, 0, null, 1200)],
    plan: { horas_dias_semana: 2, horas_sabado: 2, horas_domingo: 2 } }))
  assert.equal(deficit.subjects[0].priority, 'Abaixo da meta')
})

test('disponibilidade comprometida favorece calendário e impede estudo extra', () => {
  const planned = { ...event(), title: 'Estudar Biologia', subject_id: 'm2', duration: 60 }
  const out = buildDashboard(input({ materias: [materia(), { ...materia(), id: 'm2', name: 'Biologia' }],
    sessions: [session('2026-09-16', 20, 12)], events: [planned],
    plan: { horas_dias_semana: 1, horas_sabado: 1, horas_domingo: 1 } }))
  assert.equal(out.recommendation.kind, 'calendar')
  assert.equal(out.recommendation.title, 'Estudar Biologia')
  assert.equal(out.subjects[0].priority, 'Precisão para acompanhar')
  const noEvents = buildDashboard(input({ sessions: [session('2026-09-16', 20, 12)],
    plan: { horas_dias_semana: 0, horas_sabado: 0, horas_domingo: 0 } }))
  assert.equal(noEvents.recommendation.kind, 'maintenance')
  assert.equal(noEvents.recommendation.href, '/painel/calendario')
  assert.equal(noEvents.recommendation.cta, 'Ver calendário')
  assert.notEqual(noEvents.recommendation.title, 'Seus estudos estão em ordem')
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
