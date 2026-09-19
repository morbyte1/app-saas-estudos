import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dataTimestampBrasil, diferencaPrecisao, janela, padroesErros, pontosEvolucao, resumirSessoes } from '../lib/desempenho.ts'

const sessao = (date, total = 0, wrong = 0, materia_id = 'm1') => ({
  session_date: date, created_at: `${date}T12:00:00Z`, duration_seconds: 3600,
  questions_total: total, questions_done: total - wrong, questions_wrong: wrong, materia_id,
})

test('janelas locais incluem hoje e comparam com intervalo anterior sem sobreposição', () => {
  assert.deepEqual(janela('7', '2026-09-19'), { inicio: '2026-09-13', fim: '2026-09-19', anteriorInicio: '2026-09-06', anteriorFim: '2026-09-12' })
  assert.equal(janela('14', '2026-09-19').inicio, '2026-09-06')
  assert.equal(janela('30', '2026-09-19').inicio, '2026-08-21')
  assert.equal(janela('all', '2026-09-19').anteriorInicio, null)
  assert.equal(dataTimestampBrasil('2026-09-20T02:30:00Z'), '2026-09-19')
})

test('total usa questions_total; legado recompõe total de acertos e erradas', () => {
  const atual = resumirSessoes([sessao('2026-09-19', 10, 3), { ...sessao('2026-09-19'), questions_total: null, questions_done: 4, questions_wrong: 1 }])
  assert.deepEqual(atual, { segundos: 7200, questoes: 15, erradas: 4, sessoes: 2, precisao: 73 })
  assert.equal(resumirSessoes([sessao('2026-09-19')]).precisao, null)
})

test('tendência de precisão exige vinte questões em cada janela', () => {
  assert.equal(diferencaPrecisao(resumirSessoes([sessao('2026-09-19', 19, 1)]), resumirSessoes([sessao('2026-09-12', 50, 10)])), null)
  assert.equal(diferencaPrecisao(resumirSessoes([sessao('2026-09-19', 20, 4)]), resumirSessoes([sessao('2026-09-12', 20, 6)])), 10)
})

test('gráfico mantém dias sem sessões e não inventa precisão nesses dias', () => {
  const pontos = pontosEvolucao([sessao('2026-09-19', 10, 2)], '7', '2026-09-13', '2026-09-19')
  assert.equal(pontos.length, 7)
  assert.equal(pontos[0].precisao, null)
  assert.equal(pontos[6].precisao, 80)
})

test('padrões exigem cinco registros e ignoram amostras pequenas', () => {
  const erro = (motivo_erro) => ({ materia_id: 'm1', assunto_id: 'a1', assunto_texto: 'Funções', motivo_erro, estado: 'ativo', erros_recorrentes_count: 0, created_at: '2026-09-19T12:00:00Z', assuntos: null })
  assert.deepEqual(padroesErros([erro('Interpretação')], [{ id: 'm1', name: 'Matemática' }]), [])
  const patterns = padroesErros([erro('Interpretação'), erro('Interpretação'), erro('Interpretação'), erro('Outro'), erro('Outro')], [{ id: 'm1', name: 'Matemática' }])
  assert.equal(patterns.length, 2)
  assert.match(patterns[0], /3 dos 5 erros registrados/)
})
