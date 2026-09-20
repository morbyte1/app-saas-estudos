import ProductScreenshot from './ProductScreenshot'

const stories = [
  {
    id: 'dashboard' as const,
    eyebrow: 'Dashboard',
    title: 'Saiba o que fazer agora.',
    copy: 'Planejamento, histórico, revisões, desempenho e ritmo aparecem juntos para destacar a informação mais útil naquele momento.',
  },
  {
    id: 'timer' as const,
    eyebrow: 'Timer',
    title: 'Estude. O resto vira histórico.',
    copy: 'Registre matéria, assunto, tempo e questões na mesma sessão. Acertos e erros entram no contexto das outras áreas do Revyza.',
  },
  {
    id: 'materias' as const,
    eyebrow: 'Minhas Matérias',
    title: 'Veja sua preparação matéria por matéria.',
    copy: 'Organize tópicos e assuntos, acompanhe metas e enxergue o progresso de cada matéria junto do seu histórico.',
  },
  {
    id: 'desempenho' as const,
    eyebrow: 'Desempenho',
    title: 'Veja evolução, não apenas horas.',
    copy: 'Tempo, questões, precisão e sessões ajudam a ler sua trajetória. Comparações e padrões aparecem quando há dados suficientes para sustentá-los.',
  },
  {
    id: 'caderno' as const,
    eyebrow: 'Caderno de Erros',
    title: 'Errar deixa de ser informação descartável.',
    copy: 'Guarde o erro, o assunto e o motivo. Organize revisões e acompanhe recorrências para voltar ao que ainda merece atenção.',
  },
]

function Story({ story, index }: { story: (typeof stories)[number]; index: number }) {
  return <section className={`relative overflow-hidden px-5 py-20 sm:px-8 lg:py-28 ${index % 2 === 0 ? 'bg-[#0e1814]' : 'bg-[#1a3028]'}`} aria-labelledby={`${story.id}-title`}>
    <div className={`mx-auto grid max-w-7xl items-center gap-10 lg:gap-16 ${story.id === 'dashboard' ? 'lg:grid-cols-[.75fr_1.25fr]' : story.id === 'desempenho' ? 'lg:grid-cols-[.85fr_1.15fr]' : 'lg:grid-cols-2'}`}>
      <div className={index % 2 === 0 ? '' : 'lg:order-2'}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A9CEA7]">{story.eyebrow}</p>
        <h3 id={`${story.id}-title`} className="mt-5 max-w-xl text-4xl font-semibold leading-[1.1] tracking-[-0.04em] text-[#F1F7ED] sm:text-5xl">{story.title}</h3>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-[#F1F7ED]/65">{story.copy}</p>
      </div>
      <ProductScreenshot id={story.id} className={`${index % 2 === 0 ? '' : 'lg:order-1'} ring-1 ring-[#7CA982]/[.06]`} />
    </div>
  </section>
}

export default function ProductShowcase() {
  return <div id="recursos" className="scroll-mt-24">
    <div className="border-y border-[#E0EEC6]/10 bg-[#0b1210] px-5 py-16 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A9CEA7]">O produto</p><h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-[#F1F7ED] sm:text-4xl">Uma preparação. Um contexto conectado.</h2></div>
        <p className="max-w-xs text-sm leading-relaxed text-[#F1F7ED]/55">Cada área resolve uma parte do estudo. Juntas, elas ajudam a ler o todo.</p>
      </div>
    </div>
    {stories.slice(0, 3).map((story, index) => <Story key={story.id} story={story} index={index} />)}
    <section className="bg-[#20382f] px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="planejamento-title">
      <div className="mx-auto max-w-7xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A9CEA7]">Planejamento</p>
        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <h3 id="planejamento-title" className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl">Planeje sem perder o contexto da sua rotina.</h3>
          <p className="max-w-md text-base leading-relaxed text-[#F1F7ED]/65">O Calendário organiza suas atividades. Meu Plano registra metas e disponibilidade. Assim, o planejamento considera o tempo que você realmente tem.</p>
        </div>
        <div className="mt-11 grid gap-5 lg:grid-cols-2">
          <div><ProductScreenshot id="calendario" /><p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#F1F7ED]/50">Calendário</p></div>
          <div><ProductScreenshot id="plano" /><p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#F1F7ED]/50">Meu Plano</p></div>
        </div>
      </div>
    </section>
    {stories.slice(3).map((story, index) => <Story key={story.id} story={story} index={index + 3} />)}
  </div>
}
