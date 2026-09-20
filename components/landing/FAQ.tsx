import { ChevronDown } from 'lucide-react'

const faqs = [
  ['O Revyza é um cursinho?', 'Não. O Revyza organiza e interpreta sua preparação; você continua estudando com os materiais e professores que escolher.'],
  ['O Revyza oferece aulas ou questões?', 'O Revyza não oferece aulas nem um banco de questões. Você pode registrar o estudo e os resultados das questões feitas em outros lugares.'],
  ['Preciso abandonar meu cursinho ou plataforma atual?', 'Não. Continue estudando onde preferir. O Revyza reúne planejamento, registros e histórico para ajudar você a entender o que fazer depois.'],
  ['Como o Revyza sabe o que sugerir?', 'Ele considera o que você registra: estudo, questões, erros, revisões, metas e planejamento. As leituras dependem dos dados disponíveis e não substituem suas decisões.'],
  ['Posso usar o Revyza para ENEM e vestibulares?', 'Sim. Você pode organizar matérias, objetivos e rotina de preparação para ENEM e vestibulares.'],
  ['O Revyza é grátis?', 'O cadastro atual não apresenta cobrança. Não há valores ou condições de planos pagos publicados nesta página; confira a disponibilidade de acesso no cadastro.'],
]

export default function FAQ() {
  return <section id="faq" className="scroll-mt-24 bg-[#14251f] px-5 py-24 sm:px-8 lg:py-32" aria-labelledby="faq-title">
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A9CEA7]">FAQ</p><h2 id="faq-title" className="mt-5 text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl">Perguntas frequentes.</h2></div>
      <div className="border-t border-[#E0EEC6]/20">
        {faqs.map(([question, answer]) => <details key={question} className="group border-b border-[#E0EEC6]/15">
          <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 py-5 text-base font-medium text-[#F1F7ED] marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0EEC6] [&::-webkit-details-marker]:hidden"><span>{question}</span><ChevronDown className="size-5 shrink-0 text-[#A9CEA7] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></summary>
          <p className="max-w-2xl pb-6 pr-8 text-sm leading-relaxed text-[#F1F7ED]/65">{answer}</p>
        </details>)}
      </div>
    </div>
  </section>
}
