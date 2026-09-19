export default function LoadingDesempenho() {
  return <main className="min-h-screen bg-slate-50 p-4 sm:p-8"><div role="status" className="mx-auto max-w-6xl">
    <h1 className="text-3xl font-extrabold text-slate-900">Desempenho</h1><p className="mt-2 text-sm text-slate-600">Carregando sua análise...</p>
    <div aria-hidden="true" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div>
    <div aria-hidden="true" className="mt-8 h-80 animate-pulse rounded-3xl bg-white" />
  </div></main>
}
