'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AMOSTRA_MINIMA_PRECISAO, atividadeAno, assuntosDaMateria, dataDaSessao, dataTimestampBrasil, dentro, diferencaPrecisao, formatarDataHumana, formatarTempo, formatarTempoExtenso, padroesErros, pontosEvolucao, resumirSessoes, type AssuntoDesempenho, type ErroDesempenho, type Periodo, type SessaoDesempenho } from '@/lib/desempenho'
import DesempenhoTooltip from './DesempenhoTooltip'

type Props = {
  periodo: Periodo
  limites: { inicio: string | null; fim: string; anteriorInicio: string | null; anteriorFim: string | null }
  sessoes: SessaoDesempenho[]
  materias: { id: string; name: string }[]
  assuntos: AssuntoDesempenho[]
  erros: ErroDesempenho[]
}
type Metrica = 'precisao' | 'questoes' | 'tempo'
const periodos: { key: Periodo; label: string }[] = [
  { key: '7', label: '7 dias' }, { key: '14', label: '14 dias' }, { key: '30', label: '30 dias' }, { key: 'all', label: 'Todo período' },
]

const coresAtividade = ['bg-slate-100', 'bg-primary-100', 'bg-primary-200', 'bg-primary-400', 'bg-primary-600']

export default function EstatisticasClient({ periodo, limites, sessoes, materias, assuntos, erros }: Props) {
  const [metrica, setMetrica] = useState<Metrica>('precisao')
  const [materiaAberta, setMateriaAberta] = useState<string | null>(null)
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)
  const atual = sessoes.filter(s => dentro(dataDaSessao(s), limites.inicio, limites.fim))
  const anterior = limites.anteriorInicio && limites.anteriorFim
    ? sessoes.filter(s => dentro(dataDaSessao(s), limites.anteriorInicio, limites.anteriorFim!)) : []
  const resumo = resumirSessoes(atual)
  const resumoAnterior = resumirSessoes(anterior)
  const temComparacao = periodo !== 'all' && resumoAnterior.sessoes > 0
  const deltaPrecisao = temComparacao ? diferencaPrecisao(resumo, resumoAnterior) : null
  const errosAtuais = erros.filter(e => dentro(dataTimestampBrasil(e.created_at), limites.inicio, limites.fim))
  const padroes = padroesErros(errosAtuais, materias)
  const pontos = pontosEvolucao(atual, periodo, limites.inicio, limites.fim)
  const dadosGrafico = pontos.map(p => ({ ...p, tempo: Number((p.segundos / 3600).toFixed(2)) }))
  const ano = atividadeAno(sessoes, limites.fim)
  const dia = ano.find(item => item.data === diaSelecionado)
  const inicioSemana = ano.length ? (new Date(`${ano[0].data}T12:00:00Z`).getUTCDay() + 6) % 7 : 0
  const materiasAtivas = materias.map(m => {
    const a = resumirSessoes(atual.filter(s => s.materia_id === m.id))
    const b = resumirSessoes(anterior.filter(s => s.materia_id === m.id))
    return { ...m, atual: a, anterior: b, delta: temComparacao ? diferencaPrecisao(a, b) : null }
  }).filter(m => m.atual.sessoes > 0).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const sinal = (n: number) => n > 0 ? '+' : n < 0 ? '−' : ''
  const numero = (n: number) => `${sinal(n)}${Math.abs(n)}`
  const infoAnterior = periodo === 'all' ? null : 'Sem sessões no período anterior'
  const cards = [
    { label: 'Tempo estudado', value: formatarTempo(resumo.segundos), detail: temComparacao ? `${sinal(resumo.segundos - resumoAnterior.segundos)}${formatarTempo(resumo.segundos - resumoAnterior.segundos)} vs período anterior` : infoAnterior },
    { label: 'Questões', value: String(resumo.questoes), detail: temComparacao ? `${numero(resumo.questoes - resumoAnterior.questoes)} vs período anterior` : infoAnterior },
    { label: 'Precisão', value: resumo.precisao === null ? '—' : `${resumo.precisao}%`, detail: deltaPrecisao === null ? (periodo === 'all' ? null : `Comparação exige ${AMOSTRA_MINIMA_PRECISAO} questões em cada período`) : `${numero(deltaPrecisao)} p.p. vs período anterior` },
    { label: 'Sessões', value: String(resumo.sessoes), detail: temComparacao ? `${numero(resumo.sessoes - resumoAnterior.sessoes)} vs período anterior` : infoAnterior },
  ]
  const leitura = deltaPrecisao === null ? 'Ainda não há dados suficientes para avaliar sua evolução da precisão.'
    : deltaPrecisao === 0 ? `Precisão estável em ${resumo.precisao}%, com ${resumo.questoes} questões neste período.`
      : `Precisão ${deltaPrecisao > 0 ? 'subiu' : 'caiu'} de ${resumoAnterior.precisao}% para ${resumo.precisao}%, com ${resumo.questoes} questões neste período.`

  return <main className="min-h-screen bg-slate-50 p-4 pb-10 text-slate-900 sm:p-8">
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold">Desempenho</h1>
        <p className="mt-2 text-sm text-slate-600">Acompanhe estudo, prática e precisão com base nos seus registros.</p>
        <nav aria-label="Período da análise" className="mt-5 flex flex-wrap gap-2">
          {periodos.map(p => <Link key={p.key} href={`/painel/estatisticas?periodo=${p.key}`} aria-current={periodo === p.key ? 'page' : undefined} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${periodo === p.key ? 'bg-primary-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-primary-300'}`}>{p.label}</Link>)}
        </nav>
        <p className="mt-3 text-xs text-slate-500">{periodo === 'all' ? 'Todo o histórico disponível' : `${limites.inicio?.split('-').reverse().join('/')} a ${limites.fim.split('-').reverse().join('/')} · comparação com os ${periodo} dias anteriores`}</p>
      </header>

      <section aria-label="Resumo do período" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(card => <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">{card.value}</p>
          {card.detail && <p className="mt-2 text-xs leading-relaxed text-slate-500">{card.detail}</p>}
        </div>)}
      </section>

      <section aria-labelledby="evolucao-title" className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 id="evolucao-title" className="text-xl font-bold">Sua evolução</h2><p className="mt-1 text-sm text-slate-500">{periodo === 'all' ? 'Agrupado por mês' : periodo === '30' ? 'Agrupado em blocos de sete dias' : 'Agrupado por dia'}</p></div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Métrica do gráfico">
            {([{ key: 'precisao', label: 'Precisão' }, { key: 'questoes', label: 'Questões' }, { key: 'tempo', label: 'Tempo' }] as const).map(item => <button key={item.key} onClick={() => setMetrica(item.key)} aria-pressed={metrica === item.key} className={`rounded-lg px-3 py-2 text-xs font-semibold ${metrica === item.key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600'}`}>{item.label}</button>)}
          </div>
        </div>
        {atual.length === 0 ? <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">Ainda não há sessões neste período.</p> : <>
          <div role="img" aria-label={`Evolução de ${metrica} no período selecionado`} className="mt-6 h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              {metrica === 'precisao' ? <LineChart data={dadosGrafico} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={16} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" /><Tooltip content={<DesempenhoTooltip metrica={metrica} />} /><Line dataKey="precisao" name="Precisão" stroke="#436E4B" strokeWidth={2.5} dot={dadosGrafico.length <= 14} connectNulls={false} /></LineChart>
                : <BarChart data={dadosGrafico} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={16} /><YAxis tick={{ fontSize: 11 }} /><Tooltip content={<DesempenhoTooltip metrica={metrica} />} />{metrica === 'tempo'
                  ? <Bar dataKey="tempo" name="Tempo" fill="#436E4B" radius={[5, 5, 0, 0]} />
                  : <><Bar dataKey="acertos" name="Acertos" stackId="questoes" fill="#436E4B" /><Bar dataKey="erradas" name="Erros" stackId="questoes" fill="#aab9aa" radius={[5, 5, 0, 0]} /></>}</BarChart>}
            </ResponsiveContainer>
          </div>
          {metrica === 'precisao' && resumo.questoes === 0 && <p className="mt-3 text-sm text-slate-500">Nenhuma questão registrada neste período; precisão indisponível.</p>}
          {metrica === 'questoes' && <p className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500"><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-primary-700" />Acertos</span><span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#aab9aa]" />Erros</span></p>}
          {periodo !== 'all' && <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">{leitura}</p>}
        </>}
      </section>

      <section aria-labelledby="acertos-title" className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="acertos-title" className="text-xl font-bold">Acertos e erros nas questões</h2><p className="text-sm text-slate-500">{resumo.questoes} questões no período</p></div>
        {resumo.questoes === 0 ? <p className="mt-4 text-sm text-slate-500">Nenhuma questão registrada neste período; a precisão ainda não é calculável.</p> : <>
          <div className="mt-5 flex justify-between gap-4"><div><p className="text-xs font-semibold text-slate-500">Acertos</p><p className="mt-1 text-2xl font-bold text-primary-800">{resumo.acertos}</p></div><div className="text-right"><p className="text-xs font-semibold text-slate-500">Erros nas questões</p><p className="mt-1 text-2xl font-bold text-slate-700">{resumo.erradas}</p></div></div>
          <div role="img" aria-label={`${resumo.acertos} acertos e ${resumo.erradas} erros em ${resumo.questoes} questões`} className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-200"><div className="bg-primary-600" style={{ width: `${(resumo.acertos / resumo.questoes) * 100}%` }} /><div className="bg-[#aab9aa]" style={{ width: `${(resumo.erradas / resumo.questoes) * 100}%` }} /></div>
          <div className="mt-2 flex justify-between text-xs font-semibold text-slate-600"><span>{resumo.precisao}% de acertos</span><span>{Math.round((resumo.erradas / resumo.questoes) * 100)}% de erros</span></div>
        </>}
      </section>

      <section aria-labelledby="materias-title">
        <div><h2 id="materias-title" className="text-xl font-bold">Por matéria</h2><p className="mt-1 text-sm text-slate-500">Matérias com sessões no período, em ordem alfabética.</p></div>
        {materiasAtivas.length ? <div className="mt-4 grid items-start gap-3 md:grid-cols-2">{materiasAtivas.map(m => {
          const aberto = materiaAberta === m.id
          const detalhe = aberto ? assuntosDaMateria(atual, assuntos, m.id) : null
          return <article key={m.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{m.name}</h3><p className="mt-1 text-xs text-slate-500">{formatarTempo(m.atual.segundos)} · {m.atual.sessoes} sessões</p></div><p className="text-xl font-extrabold text-primary-800">{m.atual.precisao === null ? '—' : `${m.atual.precisao}%`}</p></div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-sm"><div><p className="text-xs text-slate-500">Questões</p><p className="font-bold">{m.atual.questoes}</p></div><div><p className="text-xs text-slate-500">Acertos</p><p className="font-bold">{m.atual.acertos}</p></div><div><p className="text-xs text-slate-500">Erros</p><p className="font-bold">{m.atual.erradas}</p></div></div>
            {m.delta !== null ? <p className="mt-3 text-xs font-semibold text-primary-700">Precisão {numero(m.delta)} p.p. vs período anterior</p> : m.atual.questoes > 0 && m.atual.questoes < AMOSTRA_MINIMA_PRECISAO ? <p className="mt-3 text-xs text-slate-500">Precisão baseada em amostra pequena</p> : null}
            <button type="button" aria-expanded={aberto} onClick={() => setMateriaAberta(aberto ? null : m.id)} className="mt-4 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-left text-sm font-semibold text-primary-700">{aberto ? 'Ocultar assuntos' : 'Ver assuntos'}<ChevronDown className={`h-4 w-4 transition-transform ${aberto ? 'rotate-180' : ''}`} /></button>
            {detalhe && <div className="mt-3 space-y-2 border-t border-slate-100 pt-3"><p className="text-xs text-slate-500">Questões de sessões associadas a cada assunto.</p>{detalhe.itens.length ? detalhe.itens.map(a => <div key={a.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-slate-800">{a.name}</p><p className="text-sm font-bold text-primary-800">{a.precisao === null ? '—' : `${a.precisao}%`}</p></div><p className="mt-1 text-xs text-slate-600">{a.questoes} questões · {a.acertos} acertos · {a.erradas} erros</p>{a.questoes > 0 && a.questoes < AMOSTRA_MINIMA_PRECISAO && <p className="mt-1 text-xs text-slate-500">Amostra pequena</p>}</div>) : <p className="text-sm text-slate-500">Nenhuma sessão com assunto cadastrado nesta matéria no período.</p>}{detalhe.questoesSemAssunto > 0 && <p className="text-xs text-slate-500">{detalhe.questoesSemAssunto} questões de sessões sem assunto válido entram no total da matéria.</p>}</div>}
          </article>
        })}</div> : <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">Nenhuma matéria com sessão registrada neste período.</p>}
        {atual.some(s => !s.materia_id) && <p className="mt-2 text-xs text-slate-500">Sessões sem matéria associada entram no total geral, mas não aparecem nesta lista.</p>}
      </section>

      <section aria-labelledby="erros-title" className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="erros-title" className="text-xl font-bold">Padrões nos seus erros</h2><p className="mt-1 text-sm text-slate-500">{errosAtuais.length} erros registrados no Caderno neste período · {errosAtuais.filter(e => e.estado === 'resolvido').length} resolvidos</p></div><Link href="/painel/caderno" className="text-sm font-bold text-primary-700 hover:underline">Ver no Caderno</Link></div>
        {padroes.length ? <ul className="mt-5 space-y-3">{padroes.map(p => <li key={p} className="rounded-xl bg-primary-50 p-3 text-sm text-slate-700">{p}</li>)}</ul> : <p className="mt-5 text-sm text-slate-500">Ainda não há um padrão consistente nos erros registrados neste período.</p>}
      </section>

      <section aria-labelledby="ano-title" className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 id="ano-title" className="text-xl font-bold">Seu ano de estudos</h2>
        <p className="mt-1 text-sm text-slate-500">Veja sua constância desde 1º de janeiro deste ano.</p>
          <p className="mt-3 text-xs text-slate-500">{formatarDataHumana(ano[0].data, true)} a {formatarDataHumana(ano[ano.length - 1].data, true)} · clique ou toque em um dia para ver os registros</p>
          <div className="mt-4 max-w-full overflow-x-auto pb-2" aria-label="Atividade diária dos estudos">
            <div className="w-max">
              <div className="grid w-max grid-flow-col grid-rows-7 auto-cols-[12px] gap-1">
                {Array.from({ length: inicioSemana }, (_, index) => <span key={`vazio-${index}`} aria-hidden="true" className="h-3 w-3" />)}
                {ano.map(item => <button key={item.data} type="button" aria-label={`${formatarDataHumana(item.data, true)}: ${item.sessoes} sessões, ${formatarTempoExtenso(item.segundos)}, ${item.questoes} questões`} aria-pressed={diaSelecionado === item.data} onClick={() => setDiaSelecionado(item.data)} className={`h-3 w-3 rounded-[3px] ${coresAtividade[item.nivel]} ${diaSelecionado === item.data ? 'ring-2 ring-primary-700 ring-offset-1' : 'hover:ring-1 hover:ring-primary-500'}`} />)}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span>Menos atividade</span>{coresAtividade.map((cor, index) => <span key={index} className={`h-3 w-3 rounded-[3px] ${cor}`} />)}<span>Mais atividade</span><span className="ml-auto">Intensidade por tempo estudado</span></div>
          {dia && <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm" aria-live="polite"><p className="font-bold text-slate-900">{formatarDataHumana(dia.data, true)}</p>{dia.sessoes ? <div className="mt-2 space-y-1"><p>Tempo estudado: {formatarTempoExtenso(dia.segundos)}</p><p>Sessões: {dia.sessoes}</p><p>Questões: {dia.questoes}</p></div> : <p className="mt-2">Nenhuma sessão registrada.</p>}</div>}
      </section>
    </div>
  </main>
}
