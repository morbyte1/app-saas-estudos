import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Brand from './Brand'
import ProductScreenshot from './ProductScreenshot'
import { loginHref, signupHref } from './routes'

const examples = ['Precisão em melhora', 'Matemática em observação', 'Conteúdo em revisão', 'Seu plano está alinhado']
const questions = [
  'Quanto estudei esta semana?',
  'Minha precisão realmente melhorou?',
  'O que continuo errando?',
  'Qual matéria está ficando de lado?',
  'O que eu deveria fazer agora?',
  'Meu planejamento acompanha minha rotina?',
]
const principles = [
  ['Integração real', 'O que você registra em uma área pode fazer diferença nas outras.'],
  ['Evidência antes de conclusão', 'Poucos dados não viram diagnóstico. O histórico dá contexto às leituras.'],
  ['Você continua no controle', 'O sistema destaca sinais e próximos passos; a decisão continua sendo sua.'],
]

export function Insights() {
  return <section className="bg-[#0b1210] px-5 py-24 sm:px-8 lg:py-32" aria-labelledby="insights-title">
    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A9CEA7]">O Revyza percebeu</p>
        <h2 id="insights-title" className="mt-5 text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl">Algumas coisas são difíceis de perceber olhando números isolados.</h2>
        <p className="mt-7 max-w-xl text-base leading-relaxed text-[#F1F7ED]/65">A Dashboard pode destacar sinais do seu estudo quando há histórico para sustentá-los. Os nomes ao lado são exemplos de categorias de análise, não dados de uma conta.</p>
        <p className="mt-9 max-w-lg border-l-2 border-[#C2A83E] pl-5 text-xl font-medium leading-snug tracking-[-0.02em] text-[#E0EEC6] sm:text-2xl">O Revyza encontra sinais. <span className="block text-[#F1F7ED]">Você continua tomando as decisões.</span></p>
      </div>
      <div className="self-center rounded-[28px] border border-[#E0EEC6]/10 bg-[#14251f] p-6 shadow-[0_30px_70px_-45px_rgba(0,0,0,.75)] sm:p-8">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F1F7ED]/45">Exemplos de sinais possíveis</p>
        {examples.map((example, index) => <div key={example} className="relative flex items-center gap-5 border-t border-[#E0EEC6]/12 py-5 before:absolute before:-left-6 before:top-1/2 before:size-1 before:rounded-full before:bg-[#C2A83E] sm:before:-left-8">
          <span className="text-xs text-[#C2A83E]">0{index + 1}</span>
          <span className="text-lg font-medium text-[#F1F7ED]">{example}</span>
          <ArrowUpRight className="ml-auto size-4 shrink-0 text-[#7CA982]" aria-hidden="true" />
        </div>)}
      </div>
    </div>
  </section>
}

export function BeforeAfter() {
  return <section className="bg-[#1b3028] px-5 py-24 sm:px-8 lg:py-32" aria-labelledby="before-after-title">
    <div className="mx-auto max-w-7xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A9CEA7]">Mais contexto</p>
      <h2 id="before-after-title" className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl">Menos perguntas soltas. Mais contexto.</h2>
      <div className="mt-12 grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-12">
        <div className="rounded-[26px] border border-[#E0EEC6]/10 bg-[#0b1511] p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F1F7ED]/50">Sem Revyza</p>
          <ul className="mt-5 divide-y divide-[#E0EEC6]/10">{questions.map(question => <li key={question} className="py-3.5 text-sm leading-relaxed text-[#F1F7ED]/65">{question}</li>)}</ul>
        </div>
        <div>
          <div className="mb-6 rounded-[26px] border border-[#7CA982]/35 bg-[#243E36] p-6 shadow-[0_24px_60px_-42px_rgba(0,0,0,.8)] sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A9CEA7]">Com Revyza</p>
            <p className="mt-4 text-xl font-medium leading-relaxed tracking-[-0.02em]">Histórico, planejamento, desempenho, erros e revisões no mesmo contexto.</p>
            <p className="mt-3 text-sm leading-relaxed text-[#F1F7ED]/60">O sistema ajuda a organizar essas respostas a partir do que você registrou, sem inventar resultados.</p>
          </div>
          <ProductScreenshot id="desempenho" />
        </div>
      </div>
    </div>
  </section>
}

export function Trust() {
  return <section className="bg-[#0e1814] px-5 py-24 sm:px-8 lg:py-28" aria-labelledby="trust-title">
    <div className="mx-auto max-w-7xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A9CEA7]">Princípios</p>
      <h2 id="trust-title" className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl">Feito para dar clareza, não mais trabalho.</h2>
      <div className="mt-12 grid border-t border-[#E0EEC6]/20 md:grid-cols-3">
        {principles.map(([title, copy], index) => <div key={title} className="border-b border-[#E0EEC6]/15 py-7 md:border-b-0 md:border-r md:border-[#E0EEC6]/10 md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
          <span className="text-5xl font-semibold tracking-[-0.07em] text-[#C2A83E]/30">0{index + 1}</span>
          <h3 className="mt-5 text-lg font-semibold text-[#F1F7ED]">{title}</h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#F1F7ED]/60">{copy}</p>
        </div>)}
      </div>
    </div>
  </section>
}

export function Pricing() {
  return <section className="bg-[#20382f] px-5 py-20 sm:px-8 lg:py-24" aria-labelledby="pricing-title">
    <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A9CEA7]">Acesso</p>
        <h2 id="pricing-title" className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Comece grátis.</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#F1F7ED]/65">Crie sua conta para conhecer o Revyza. Não há tabela pública de planos ou preços definida nesta página.</p>
      </div>
      <Link href={signupHref} className="inline-flex min-h-12 items-center justify-center gap-3 self-start rounded-full bg-[#E0EEC6] px-7 text-sm font-bold text-[#243E36] transition-colors hover:bg-[#F1F7ED] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0EEC6]">Começar grátis <ArrowRight className="size-4" aria-hidden="true" /></Link>
    </div>
  </section>
}

export function FinalCTA() {
  return <section className="landing-final relative overflow-hidden bg-[#080f0c] px-5 py-28 text-center sm:px-8 lg:py-40" aria-labelledby="final-cta-title">
    <div className="pointer-events-none absolute left-1/2 top-1/2 size-[650px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7CA982]/[.10] blur-[110px]" aria-hidden="true" />
    <div className="relative mx-auto max-w-5xl">
      <span className="mx-auto block h-1 w-10 rounded-full bg-[#C2A83E]" aria-hidden="true" />
      <p className="mt-8 text-lg text-[#F1F7ED]/65">Você já coloca esforço nos estudos.</p>
      <h2 id="final-cta-title" className="mx-auto mt-4 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Faça esse esforço gerar <span className="text-[#A9CEA7]">contexto para o próximo passo.</span></h2>
      <Link href={signupHref} className="mt-10 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#E0EEC6] px-7 text-sm font-bold text-[#243E36] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#F1F7ED] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0EEC6] motion-reduce:transform-none">Começar no Revyza <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
    </div>
  </section>
}

export function Footer() {
  return <footer className="border-t border-[#E0EEC6]/10 bg-[#080f0c] px-5 py-10 sm:px-8">
    <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
      <div><Brand /><p className="mt-1 text-xs text-[#F1F7ED]/45">Estude onde quiser. Entenda o que fazer depois.</p></div>
      <nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#F1F7ED]/65">
        <Link href={loginHref} className="hover:text-[#F1F7ED] focus-visible:outline-2 focus-visible:outline-[#E0EEC6]">Entrar</Link>
        <Link href={signupHref} className="hover:text-[#F1F7ED] focus-visible:outline-2 focus-visible:outline-[#E0EEC6]">Começar grátis</Link>
        <Link href="/termos" className="hover:text-[#F1F7ED] focus-visible:outline-2 focus-visible:outline-[#E0EEC6]">Termos</Link>
        <Link href="/privacidade" className="hover:text-[#F1F7ED] focus-visible:outline-2 focus-visible:outline-[#E0EEC6]">Privacidade</Link>
      </nav>
    </div>
  </footer>
}
