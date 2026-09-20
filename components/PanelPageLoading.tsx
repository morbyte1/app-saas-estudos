export default function PanelPageLoading() {
  const skeleton = 'rounded-xl bg-slate-200/70 motion-safe:animate-pulse'

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8" role="status" aria-live="polite">
      <span className="sr-only">Carregando página...</span>
      <div className="mx-auto max-w-7xl" aria-hidden="true">
        <div className={`${skeleton} h-9 w-48`} />
        <div className={`${skeleton} mt-3 h-4 w-64 max-w-full`} />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(item => (
            <div key={item} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className={`${skeleton} h-4 w-24`} />
              <div className={`${skeleton} mt-5 h-8 w-32`} />
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className={`${skeleton} h-5 w-40`} />
          <div className={`${skeleton} mt-6 h-40 w-full`} />
        </div>
      </div>
    </main>
  )
}
