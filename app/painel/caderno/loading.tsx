export default function LoadingCaderno() {
  return <main className="min-h-screen bg-slate-50 p-4 pb-8 sm:p-8">
    <div className="mx-auto max-w-5xl" role="status" aria-live="polite">
      <h1 className="text-3xl font-extrabold text-slate-900">Caderno de Erros</h1>
      <p className="mt-2 text-sm text-slate-600">Carregando seus erros e revisões...</p>
      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4" aria-hidden="true">
        {[0, 1, 2].map(item => <div key={item} className="h-20 motion-safe:animate-pulse rounded-2xl bg-white shadow-sm" />)}
      </div>
      <div className="mt-8 space-y-3" aria-hidden="true">
        {[0, 1].map(item => <div key={item} className="h-28 motion-safe:animate-pulse rounded-2xl bg-white shadow-sm" />)}
      </div>
    </div>
  </main>
}
