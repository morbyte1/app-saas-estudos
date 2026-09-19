import { test } from 'node:test'
import assert from 'node:assert/strict'
import { atividadeAno, assuntosDaMateria, dataTimestampBrasil, diferencaPrecisao, formatarTempoExtenso, janela, nivelAtividade, padroesErros, pontosEvolucao, resumirSessoes, tituloPeriodo } from '../lib/desempenho.ts'

const sessao = (date, total = 0, wrong = 0, materia_id = 'm1') => ({
  session_date: date, created_at: `${date}T12:00:00Z`, duration_seconds: 3600,
  questions_total: total, questions_done: total - wrong, questions_wrong: wrong, materia_id,
  assunto_id: null,
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
  assert.deepEqual(atual, { segundos: 7200, questoes: 15, acertos: 11, erradas: 4, sessoes: 2, precisao: 73 })
  assert.equal(resumirSessoes([sessao('2026-09-19')]).precisao, null)
  assert.equal(atual.questoes - atual.erradas, 11)
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
  assert.deepEqual([pontos[6].questoes, pontos[6].acertos, pontos[6].erradas, pontos[6].sessoes], [10, 8, 2, 1])
})

test('barras de questões usam composição de acertos e erros por bloco', () => {
  const pontos = pontosEvolucao([sessao('2026-09-01', 10, 2), sessao('2026-09-07', 5, 3), sessao('2026-09-08', 4, 0)], '30', '2026-08-21', '2026-09-19')
  assert.equal(pontos.length, 5)
  assert.deepEqual(pontos.map(p => p.acertos + p.erradas), pontos.map(p => p.questoes))
  assert.equal(pontos.reduce((sum, p) => sum + p.erradas, 0), 5)
  assert.equal(pontos.at(-1).fim, '2026-09-19')
  assert.match(tituloPeriodo(pontos.at(-1)), /setembro/)
  assert.equal(pontosEvolucao([sessao('2026-09-19', 1)], 'all', null, '2026-09-19')[0].fim, '2026-09-19')
})

test('tempo humano usa minutos e concordância, sem horas decimais', () => {
  assert.equal(formatarTempoExtenso(1800), '30 minutos')
  assert.equal(formatarTempoExtenso(3600), '1 hora')
  assert.equal(formatarTempoExtenso(3900), '1 hora e 5 minutos')
  assert.equal(formatarTempoExtenso(66180), '18 horas e 23 minutos')
})

test('atividade diária vai de janeiro até hoje, inclusive sem sessões e em anos bissextos', () => {
  assert.deepEqual(atividadeAno([], '2026-01-01').map(dia => [dia.data, dia.nivel]), [['2026-01-01', 0]])
  const dias = atividadeAno([sessao('2025-09-20', 2), sessao('2026-09-19', 3), sessao('2026-09-20', 99)], '2026-09-19')
  assert.equal(dias.length, 262)
  assert.equal(dias[0].data, '2026-01-01')
  assert.equal(dias.at(-1).data, '2026-09-19')
  assert.equal(dias[1].sessoes, 0)
  assert.equal(dias[1].nivel, 0)
  assert.equal(dias.at(-1).questoes, 3)
  assert.equal(nivelAtividade(1799), 1)
  assert.equal(nivelAtividade(1800), 2)
  assert.equal(nivelAtividade(3600), 3)
  assert.equal(nivelAtividade(7200), 4)
  assert.equal(atividadeAno([], '2024-12-31').length, 366)
  assert.equal(atividadeAno([], '2025-01-01').length, 1)
  const pertoDaMeiaNoite = atividadeAno([{ ...sessao('2026-09-20', 2), session_date: null, created_at: '2026-09-20T02:30:00Z' }], '2026-09-19')
  assert.equal(pertoDaMeiaNoite.at(-1).data, '2026-09-19')
})

test('assunto só recebe questões de sessão com vínculo válido à matéria', () => {
  const comAssunto = (date, total, wrong, materia, assunto) => ({ ...sessao(date, total, wrong, materia), assunto_id: assunto })
  const dados = assuntosDaMateria([
    comAssunto('2026-09-19', 10, 4, 'm1', 'a1'),
    comAssunto('2026-09-19', 3, 1, 'm1', 'a2'),
    comAssunto('2026-09-19', 5, 2, 'm1', null),
    comAssunto('2026-09-19', 7, 2, 'm2', 'a1'),
  ], [{ id: 'a1', name: 'Funções', materia_id: 'm1' }, { id: 'a2', name: 'Geometria', materia_id: 'm2' }], 'm1')
  assert.equal(dados.itens.length, 1)
  assert.deepEqual([dados.itens[0].questoes, dados.itens[0].erradas, dados.itens[0].precisao], [10, 4, 60])
  assert.equal(dados.questoesSemAssunto, 8)
})

test('padrões exigem cinco registros e ignoram amostras pequenas', () => {
  const erro = (motivo_erro) => ({ materia_id: 'm1', assunto_id: 'a1', assunto_texto: 'Funções', motivo_erro, estado: 'ativo', erros_recorrentes_count: 0, created_at: '2026-09-19T12:00:00Z', assuntos: null })
  assert.deepEqual(padroesErros([erro('Interpretação')], [{ id: 'm1', name: 'Matemática' }]), [])
  const patterns = padroesErros([erro('Interpretação'), erro('Interpretação'), erro('Interpretação'), erro('Outro'), erro('Outro')], [{ id: 'm1', name: 'Matemática' }])
  assert.equal(patterns.length, 2)
  assert.match(patterns[0], /3 dos 5 erros registrados/)
})
