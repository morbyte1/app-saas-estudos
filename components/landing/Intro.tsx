import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'
import ProductScreenshot from './ProductScreenshot'
import { signupHref } from './routes'

const signals = ['PLANEJAMENTO', 'TEMPO', 'QUESTÕES', 'ERROS', 'REVISÕES', 'METAS', 'DESEMPENHO']
const path = ['Sessão de estudo', 'Questões respondidas', 'Desempenho registrado', 'Erros e revisões', 'Planejamento', 'Próxima ação contextual']
const connections = [
  ['Timer', 'Registra estudo e questões.'],
  ['Caderno de Erros', 'Guarda erros, motivos e revisões.'],
  ['Calendário', 'Registra intenção e planejamento.'],
  ['Meu Plano', 'Define metas e disponibilidade.'],
  ['Desempenho', 'Transforma histórico em leitura.'],
  ['Dashboard', 'Reúne o contexto e destaca o próximo passo.'],
]

export function Hero() {
  return <section id="produto" className="relative scroll-mt-24 overflow-hidden border-b border-[#E0EEC6]/10 px-5 pb-24 pt-20 sm:px-8 sm:pt-28 lg:pb-32">
    <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[760px] max-w-full -translate-x-1/2 rounded-full bg-[#7CA982]/[.07] blur-[110px]" />
    <div className="relative mx-auto max-w-7xl">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_210px] lg:items-end">
        <div>
          <p className="mb-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E0EEC6]/75"><span className="h-px w-8 bg-[#C2A83E]" />Sistema de estudo pessoal</p>
          <h1 className="max-w-5xl text-[clamp(2.8rem,7.1vw,6.8rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-[#F1F7ED]">Estude onde quiser.<br /><span className="text-[#A9CEA7]">Entenda o que fazer depois.</span></h1>
          <p className="mt-8 max-w-[650px] text-base leading-relaxed text-[#F1F7ED]/70 sm:text-lg">O Revyza conecta sua rotina, matérias, questões, erros, revisões e desempenho. O que você registra ganha contexto para ajudar a enxergar o próximo passo.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={signupHref} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#E0EEC6] px-7 text-sm font-bold text-[#243E36] transition-colors hover:bg-[#F1F7ED] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0EEC6]">Começar grátis <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
            <Link href="#como-funciona" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-[#E0EEC6]/25 px-7 text-sm font-semibold text-[#F1F7ED] transition-colors hover:border-[#E0EEC6]/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0EEC6]">Ver como funciona <ArrowDown className="size-4" aria-hidden="true" /></Link>
          </div>
          <p className="mt-5 text-xs text-[#F1F7ED]/50">Use seus materiais e plataformas de sempre. Organize sua preparação em um só lugar.</p>
        </div>
        <div className="hidden border-l border-[#E0EEC6]/20 pl-6 pb-2 text-sm leading-relaxed text-[#F1F7ED]/50 lg:block">Conteúdo onde você preferir.<br />Contexto no Revyza.</div>
      </div>
      <div className="relative mt-16 sm:mt-20">
        <div className="pointer-events-none absolute -inset-5 rounded-[32px] border border-[#E0EEC6]/[.05] sm:-inset-7" />
        <ProductScreenshot id="dashboard" priority className="relative" />
        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-[#F1F7ED]/40">Visão geral do produto</p>
      </div>
    </div>
  </section>
}

export function Fragmentation() {
  return <section className="bg-[#1a3028] px-5 py-24 sm:px-8 lg:py-32">
    <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A9CEA7]">O problema</p>
        <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl">Estudar já dá trabalho. <span className="text-[#A9CEA7]">Organizar o estudo não deveria dar mais.</span></h2>
        <p className="mt-7 max-w-xl text-base leading-relaxed text-[#F1F7ED]/65">Você estuda em um lugar, planeja em outro, anota erros em outro e ainda precisa juntar tudo para entender sua rotina. Quando os registros ficam separados, o contexto também fica.</p>
      </div>
      <div aria-label="Planejamento, tempo, questões, erros, revisões, metas e desempenho reunidos no Revyza" className="rounded-[28px] border border-[#E0EEC6]/15 bg-[#14251f] p-6 shadow-[0_25px_70px_-40px_rgba(0,0,0,.7)] sm:p-9">
        <p className="text-xs font-medium text-[#F1F7ED]/40">Registros espalhados</p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {signals.map((signal, index) => <span key={signal} className={`rounded-full border px-3 py-2 text-[10px] font-semibold tracking-[0.13em] sm:text-xs ${index % 3 === 0 ? 'border-[#7CA982]/40 text-[#E0EEC6]' : 'border-[#E0EEC6]/15 text-[#F1F7ED]/55'}`}>{signal}</span>)}
        </div>
        <div className="my-8 flex items-center gap-3 text-[#7CA982]" aria-hidden="true"><span className="h-px flex-1 bg-[#7CA982]/30" /><ArrowDown className="size-4" /><span className="h-px flex-1 bg-[#7CA982]/30" /></div>
        <div className="rounded-2xl border border-[#7CA982]/35 bg-[#243E36] px-6 py-6 sm:px-8">
          <span className="text-2xl font-semibold tracking-[-0.04em] text-[#F1F7ED]">Revyza</span>
          <p className="mt-1 text-sm text-[#F1F7ED]/65">Um histórico conectado. Uma leitura mais clara da preparação.</p>
        </div>
      </div>
    </div>
  </section>
}

export function Intelligence() {
  return <section id="como-funciona" className="scroll-mt-24 bg-[#14251f] px-5 py-24 sm:px-8 lg:py-32">
    <div className="mx-auto max-w-7xl">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A9CEA7]">Como funciona</p>
        <h2 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl">O Revyza não mostra só dados. <span className="text-[#A9CEA7]">Ele conecta os pontos.</span></h2>
        <p className="mt-6 text-base leading-relaxed text-[#F1F7ED]/65">Cada registro adiciona contexto. O Revyza cruza o que você planejou, estudou, acertou, errou e precisa revisar para destacar o que merece atenção.</p>
      </div>
      <ol className="mt-14 grid gap-0 border-y border-[#E0EEC6]/15 sm:grid-cols-2 lg:grid-cols-3">
        {path.map((step, index) => <li key={step} className="relative min-h-36 border-b border-[#E0EEC6]/10 px-4 py-6 last:border-b-0 sm:px-6 lg:min-h-40 lg:border-b-0">
          <span className="text-xs font-semibold text-[#C2A83E]">0{index + 1}</span>
          <p className="mt-6 max-w-52 text-xl font-medium leading-tight tracking-[-0.025em] text-[#F1F7ED]">{step}</p>
          {index < path.length - 1 && <ArrowRight className="absolute right-5 top-6 size-4 text-[#7CA982]/70" aria-hidden="true" />}
        </li>)}
      </ol>
      <p className="mt-8 max-w-2xl border-l-2 border-[#7CA982] pl-5 text-sm leading-relaxed text-[#F1F7ED]/70">A próxima ação vem do histórico que você registra. Quando ainda não há evidência suficiente, o Revyza evita conclusões apressadas.</p>
    </div>
  </section>
}

export function Integration() {
  return <section className="bg-[#20382f] px-5 py-24 sm:px-8 lg:py-32">
    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A9CEA7]">Tudo conversa</p>
        <h2 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl">Uma ação em uma página faz diferença nas outras.</h2>
        <p className="mt-7 max-w-md text-base leading-relaxed text-[#F1F7ED]/65">Você não precisa manter cinco sistemas sincronizados. No Revyza, o que você registra passa a fazer parte do mesmo contexto.</p>
      </div>
      <div className="border-t border-[#E0EEC6]/20">
        {connections.map(([name, description], index) => <div key={name} className={`grid grid-cols-[42px_minmax(0,1fr)] gap-3 border-b border-[#E0EEC6]/15 py-5 sm:grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)] sm:items-center ${index === connections.length - 1 ? 'text-[#E0EEC6]' : ''}`}>
          <span className="text-xs text-[#C2A83E]">0{index + 1}</span>
          <h3 className="text-lg font-semibold tracking-[-0.025em] sm:text-xl">{name}</h3>
          <p className="col-start-2 text-sm leading-relaxed text-[#F1F7ED]/60 sm:col-start-3">{description}</p>
        </div>)}
      </div>
    </div>
  </section>
}
