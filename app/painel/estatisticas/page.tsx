import { getDesempenho } from './actions'
import EstatisticasClient from './EstatisticasClient'
import type { Periodo } from '@/lib/desempenho'

export default async function EstatisticasPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const params = await searchParams
  const periodo: Periodo = params.periodo === '7' || params.periodo === '14' || params.periodo === 'all' ? params.periodo : '30'
  const result = await getDesempenho(periodo)
  if (!result.data) return <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-8"><div className="mx-auto max-w-6xl"><h1 className="text-3xl font-extrabold">Desempenho</h1><p role="alert" className="mt-5 rounded-2xl border border-red-100 bg-white p-5 text-sm text-slate-700">Não foi possível carregar a análise. {result.error}</p></div></main>
  return <EstatisticasClient {...result.data} />
}
