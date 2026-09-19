import { formatarTempoExtenso, tituloPeriodo, type Ponto } from '@/lib/desempenho'

type Metrica = 'precisao' | 'questoes' | 'tempo'
type Props = { active?: boolean; payload?: { payload?: Ponto }[]; metrica: Metrica }

export default function DesempenhoTooltip({ active, payload, metrica }: Props) {
  const ponto = payload?.[0]?.payload
  if (!active || !ponto) return null
  const dados = metrica === 'tempo'
    ? [`Tempo: ${formatarTempoExtenso(ponto.segundos)}`, `Sessões: ${ponto.sessoes}`]
    : [`${metrica === 'questoes' ? 'Questões' : 'Precisão'}: ${metrica === 'questoes' ? ponto.questoes : ponto.precisao === null ? '—' : `${ponto.precisao}%`}`,
      ...(metrica === 'precisao' ? [`Questões: ${ponto.questoes}`] : []),
      `Acertos: ${ponto.acertos}`, `Erros: ${ponto.erradas}`,
      ...(metrica === 'questoes' ? [`Precisão: ${ponto.precisao === null ? '—' : `${ponto.precisao}%`}`] : [])]
  return <div className="max-w-[min(16rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-lg">
    <p className="mb-2 border-b border-slate-100 pb-2 font-bold text-slate-900">{tituloPeriodo(ponto)}</p>
    <div className="space-y-1">{dados.map(item => <p key={item}>{item}</p>)}</div>
  </div>
}
