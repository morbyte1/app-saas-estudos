export default function MateriaLoading() {
  const skeleton = 'rounded-lg bg-slate-200/70 motion-safe:animate-pulse'

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8" role="status" aria-live="polite">
      <span className="sr-only">Carregando matéria...</span>
      <div className="mx-auto max-w-5xl" aria-hidden="true">
        <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 md:flex-row md:items-center">
          <div>
            <div className={`${skeleton} h-4 w-48`} />
            <div className={`${skeleton} mt-5 h-9 w-64 max-w-full`} />
            <div className={`${skeleton} mt-4 h-7 w-44`} />
          </div>
          <div className={`${skeleton} h-12 w-full rounded-xl md:w-40`} />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map(item => (
            <div key={item} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className={`${skeleton} h-4 w-28`} />
              <div className={`${skeleton} mt-4 h-8 w-24`} />
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className={`${skeleton} h-6 w-52`} />
              <div className={`${skeleton} mt-3 h-4 w-72 max-w-full`} />
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className={`${skeleton} h-5 w-36`} />
              <div className={`${skeleton} mt-6 h-16 w-full`} />
              <div className={`${skeleton} mt-4 h-16 w-full`} />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className={`${skeleton} h-6 w-36`} />
            <div className={`${skeleton} mt-6 h-20 w-full`} />
          </div>
        </div>
      </div>
    </main>
  )
}
