"use client";

import { useState, useEffect, useRef } from "react";
import { Dancing_Script } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import {
  AlarmClockOff,
  ArrowRight,
  Check,
  Minus,
  User,
  ChevronDown,
  X,
} from "lucide-react";

const dancing = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
});

const pillars = [
  {
    title: "Cadastra suas matérias em 3 cliques e pronto.",
    body: "Sem template gigante, sem planilha em branco te encarando. Você coloca suas matérias, define quanto quer estudar por semana e o Revyza já te mostra o que fazer hoje. Organizar deixa de ser uma tarefa a parte — só acontece.",
    imageSrc: "/print-materias.png",
    imageAlt: "Aba Minhas Matérias do Revyza",
  },
  {
    title: "Foco de verdade, sem distrações.",
    body: "Um timer simples, direto na tela de estudo. Pomodoro ou cronômetro, você tem a liberdade de escolher até os minutos. Quando o tempo acaba, você já anota ali mesmo quantas questões fez e quantas errou. 100% da sua energia em um só objetivo.",
    imageSrc: "/print-timer.png",
    imageAlt: "Timer do Revyza",
  },
  {
    title: "Números reais, não só a sensação de que estudou.",
    body: "Você resolve a lista, o Revyza faz as contas. Ele monta gráficos do seu tempo de estudo, mostra quais matérias você anda deixando de lado e aponta o motivo dos seus erros. Você enxerga o que precisa ajustar meses antes da prova, não na véspera.",
    imageSrc: "/print-estatisticas.png",
    imageAlt: "Estatísticas de estudo do Revyza",
  },
];

const comparison = [
  {
    label: "Pra começar a usar",
    revyza: "Pronto em 3 cliques",
    sheets: "Um tutorial de 40 minutos no YouTube",
    timers: "Rápido, mas não sabe nada sobre seus estudos",
  },
  {
    label: "Foco",
    revyza: "Feito pra não ter distração",
    sheets: 'Você passa mais tempo formatando que estudando',
    timers: "Fácil abrir outro app no meio do tempo",
  },
  {
    label: "Onde você tá errando",
    revyza: "Separado por matéria e motivo do erro",
    sheets: "Só se você mesmo montar a fórmula certa",
    timers: "Inexistente",
  },
  {
    label: "Sua evolução",
    revyza: "Gráfico pronto e automático",
    sheets: "Só se você lembrar de preencher",
    timers: "Mostra só o tempo total, e olhe lá",
  },
];

const faqs = [
  {
    question: "O Revyza é de graça mesmo?",
    answer: "Pra quem entrar agora, nos primeiros 30 vagas da fase Beta, sim — 100% grátis, sem pedir cartão. Mais pra frente devo criar planos pagos pra quem chegar depois, mas por enquanto meu foco é ajustar o app com o feedback de quem tá usando desde o início."
  },
  {
    question: "Tem aplicativo para celular (iOS/Android)?",
    answer: "O Revyza roda direto no navegador, é um Web App. Dá pra usar no computador (recomendo, ajuda a manter o foco) ou abrir pelo navegador do celular quando precisar. App nativo pra loja ainda não existe, mas é algo que eu quero fazer no futuro."
  },
  {
    question: "Se eu não gostar, dá pra apagar meus dados?",
    answer: 'Dá sim, sem enrolação. Lá nas Configurações tem uma área de "Zona de Perigo" com um botão pra excluir sua conta e apagar todo o histórico do banco de dados. Nada fica guardado depois que você pede pra sair.'
  },
  {
    question: "Queria uma função que ainda não existe. Posso pedir?",
    answer: 'Pode, e é literalmente pra isso que essa fase Beta existe. Quando você entra, ganha acesso ao grupo dos primeiros testadores. Coisas como o "Caderno de Erros" já estão na lista, e as próximas atualizações eu vou programar de acordo com o que o grupo pedir mais.'
  }
];

function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-[opacity,transform] ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Travar o scroll do body quando a imagem estiver aberta
  useEffect(() => {
    if (zoomedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [zoomedImage]);

  return (
    <main className="scroll-smooth bg-[#F1F7ED] text-[#243E36] antialiased">
      
      {/* ZOOM LIGHTBOX */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#243E36]/90 p-4 backdrop-blur-md cursor-zoom-out transition-opacity"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-7xl w-full flex justify-center animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 md:-right-12 text-[#F1F7ED] hover:text-[#7CA982] transition-colors"
              title="Fechar (Esc)"
            >
              <X className="size-8" />
            </button>
            <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20">
              <Image 
                src={zoomedImage} 
                alt="Imagem Ampliada" 
                width={1920} 
                height={1080} 
                className="w-full h-auto max-h-[85vh] object-contain bg-slate-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR FLUTUANTE */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F1F7ED]/80 backdrop-blur-md border-b border-[#243E36]/10 transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Revyza Logo" width={100} height={30} className="object-contain" />
          </div>
          <div className="flex items-center gap-4">
            {/* O "hidden sm:block" foi removido na linha abaixo */}
            <Link href="/login" className="text-sm font-semibold text-[#243E36] hover:text-[#7CA982] transition-colors">
              Entrar
            </Link>
<Link href="/login?tab=cadastrar" className="rounded-full bg-[#243E36] px-5 py-2 text-sm font-semibold text-[#F1F7ED] shadow-sm transition-all hover:bg-[#7CA982] hover:-translate-y-0.5">
  Cadastrar
</Link>
          </div>
        </div>
      </nav>

      {/* 1. HERO (Premium) */}
      <section className="relative overflow-hidden px-6 pt-32 pb-16 sm:pt-40 md:pb-24">
        
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#d1d5db_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[400px] bg-[#7CA982]/25 rounded-full blur-[80px] -z-0 pointer-events-none" />

        <ScrollReveal className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#F1F7ED] bg-[#243E36] text-[10px] font-bold text-white shadow-sm">📚</div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#F1F7ED] bg-[#7CA982] text-[10px] font-bold text-white shadow-sm">⚡</div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#F1F7ED] bg-[#C2A83E] text-[10px] font-bold text-white shadow-sm">🎯</div>
            </div>
            <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-[#243E36] shadow-sm backdrop-blur-sm border border-[#243E36]/5">
              Mais de <strong className="text-[#7CA982]">20 estudantes</strong> já na fila
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-[#243E36] sm:text-5xl md:text-6xl drop-shadow-sm">
          Você estuda. O <span className={`text-[#7CA982] ${dancing.className} font-normal tracking-normal`}>Revyza</span> cuida do resto.
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#243E36]/75 md:text-xl">
            Senta e estuda, só isso. A gente conta seu tempo, calcula seu aproveitamento 
            e mostra exatamente onde você precisa melhorar.
          </p>
          
          <div className="mt-10">
            <Link
              href="/login"
              className="group inline-flex items-center gap-3 rounded-2xl bg-[#7CA982] px-8 py-4 text-base font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,169,130,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(124,169,130,0.6)] hover:brightness-105 md:text-lg"
            >
              Quero focar de verdade
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200} className="relative z-10 mx-auto mt-16 max-w-6xl">
          <div 
            className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-[#243E36]/10 transition-transform duration-700 hover:-translate-y-2 cursor-zoom-in group"
            onClick={() => setZoomedImage('/print-dashboard.png')}
            title="Clique para ampliar"
          >
            <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="size-2.5 rounded-full bg-red-400" />
              <div className="size-2.5 rounded-full bg-amber-400" />
              <div className="size-2.5 rounded-full bg-emerald-400" />
            </div>
            
            <div className="bg-slate-50 relative">
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5 z-10 pointer-events-none" />
              <Image 
                alt="Dashboard do Revyza" 
                src="/print-dashboard.png" 
                width={1200} 
                height={675} 
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 2. DOR */}
      <section className="bg-[#243E36] px-6 py-20 md:py-28 relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C2A83E]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <ScrollReveal className="mx-auto max-w-3xl relative z-10">
          <AlarmClockOff className="size-10 text-[#C2A83E]" strokeWidth={1.5} aria-hidden />
          <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-[#F1F7ED] sm:text-4xl">
            Você já reparou que passa mais tempo se organizando do que estudando?
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#F1F7ED]/80">
            Isso tem nome: procrastinação disfarçada de produtividade. Gastar 3 horas deixando um template bonitinho não te aprova. Resolver questão aprova. E pra isso você não precisa saber fórmula de Excel.
          </p>
        </ScrollReveal>
      </section>

      {/* 3. COMO FUNCIONA */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#7CA982]">
              Como funciona
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Três coisas que fazem sua rotina fluir.
            </h2>
          </ScrollReveal>

          <div className="mt-16 space-y-20 md:space-y-28">
            {pillars.map((pillar, i) => (
              <ScrollReveal
                key={pillar.title}
                delay={i * 100}
                className="grid items-center gap-10 md:grid-cols-2 md:gap-16"
              >
                <div className={i % 2 === 1 ? "md:order-2" : ""}>
                  <h3 className="mt-6 text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
                    {pillar.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-[#243E36]/75 md:text-lg">
                    {pillar.body}
                  </p>
                </div>

 <div
  className={`relative overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-[#243E36]/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_24px_-12px_rgba(36,62,54,0.2)] cursor-zoom-in group ${
    i % 2 === 1 ? "md:order-1" : ""
  }`}
  onClick={() => setZoomedImage(pillar.imageSrc)}
  title="Clique para ampliar"
>
  <Image 
    src={pillar.imageSrc} 
    alt={pillar.imageAlt} 
    width={1200} 
    height={675} 
    className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.03]"
  />
</div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TABELA COMPARATIVA */}
      <section className="bg-white px-6 py-20 md:py-28">
        <ScrollReveal className="mx-auto max-w-5xl">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Por que o Revyza supera o aplicativo que você usa atualmente
          </h2>

          <div className="mt-10 overflow-x-auto pb-4">
            <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th className="w-1/4 pb-4" />
                  <th className="rounded-t-2xl bg-[#E0EEC6] px-6 pb-4 pt-5 text-base font-bold text-[#243E36]">Revyza</th>
                  <th className="px-6 pb-4 pt-5 text-base font-semibold text-[#243E36]/45">Planilhas (Notion/Excel)</th>
                  <th className="px-6 pb-4 pt-5 text-base font-semibold text-[#243E36]/45">Apps de Timer</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.label} className="align-top">
                    <th className="border-t border-[#243E36]/10 py-5 pr-6 text-sm font-semibold text-[#243E36]">{row.label}</th>
                    <td className={`bg-[#E0EEC6] px-6 py-5 text-sm font-semibold text-[#243E36] ${i === comparison.length - 1 ? "rounded-b-2xl" : ""}`}>
                      <span className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#7CA982]" aria-hidden />{row.revyza}</span>
                    </td>
                    <td className="border-t border-[#243E36]/10 px-6 py-5 text-sm text-[#243E36]/45">
                      <span className="flex items-start gap-2"><Minus className="mt-0.5 size-4 shrink-0" aria-hidden />{row.sheets}</span>
                    </td>
                    <td className="border-t border-[#243E36]/10 px-6 py-5 text-sm text-[#243E36]/45">
                      <span className="flex items-start gap-2"><Minus className="mt-0.5 size-4 shrink-0" aria-hidden />{row.timers}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </section>

      {/* 5. CARTA DO FUNDADOR */}
      <section className="px-6 py-20 md:py-28">
        <ScrollReveal className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-[0_24px_60px_-24px_rgba(36,62,54,0.1)] ring-1 ring-[#243E36]/5 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#7CA982]" />
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#E0EEC6] ring-1 ring-[#243E36]/10">
              <User className="size-6 text-[#7CA982]" strokeWidth={1.5} aria-hidden />
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Por que eu criei o Revyza?</h2>
          </div>

          <div className="mt-8 space-y-5 text-lg leading-relaxed text-[#243E36]/85">
            <p>
              &quot;Eu, como estudante, percebi que gastava mais energia brigando com meus apps de organização do que efetivamente estudando. O Notion virou um poço sem fundo de template. As planilhas do Excel pareciam tarefa de contabilidade. E o cronômetro do celular só me fazia abrir o Instagram e sumir 40 minutos
            </p>
            <p>
              Cansei de tentar encaixar ferramenta de empresa na rotina bagunçada de quem só precisa sentar, estudar e passar. Eu queria uma coisa simples: apertar o play, saber quantas horas eu realmente estudei e entender por que eu tava errando, sem esse trabalho todo.
            </p>
            <p>
              Como não achei nada assim, resolvi programar eu mesmo. O Revyza não saiu de nenhuma empresa grande. É um projeto que eu tô fazendo sozinho, de quem estuda pra quem estuda. Agora tô abrindo pra 30 pessoas testarem comigo e ajudarem a decidir os próximos passos. Bora estudar junto?&quot;
            </p>
          </div>
          <p className="mt-8 text-sm font-semibold text-[#243E36]">Arthur Morais, criador do Revyza</p>
        </ScrollReveal>
      </section>

      {/* 6. FAQ */}
      <section className="bg-white px-6 py-20 md:py-28">
        <ScrollReveal className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Perguntas Frequentes</h2>
            <p className="mt-4 text-lg text-[#243E36]/75">O que você precisa saber antes de entrar.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="group rounded-2xl bg-[#F1F7ED] p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer ring-1 ring-[#243E36]/5">
                <summary className="flex items-center justify-between font-bold text-[#243E36] text-lg">
                  {faq.question}
                  <ChevronDown className="size-5 text-[#7CA982] transition-transform duration-300 group-open:-rotate-180" />
                </summary>
                <p className="mt-4 text-[#243E36]/80 leading-relaxed pr-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* 7. CTA FINAL */}
      <section id="garantir-vaga" className="bg-[#243E36] px-6 py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#7CA982]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <ScrollReveal className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F1F7ED] sm:text-5xl">Garanta uma das 30 vagas.</h2>
          <p className="mt-6 text-lg leading-relaxed text-[#F1F7ED]/80">
            O Revyza ainda tá em fase Beta fechada. Pra manter tudo rápido e conseguir ouvir o feedback de todo mundo, só estou liberando acesso grátis pros primeiros 30 testadores. Se você quer parar de perder tempo com planilha e focar na aprovação, essa é a hora de entrar.
          </p>
          <div className="mt-10">
<Link href="/login?tab=cadastrar" className="group inline-flex items-center gap-3 rounded-2xl bg-[#C2A83E] px-8 py-4 text-base font-bold text-[#243E36] shadow-[0_8px_24px_-12px_rgba(194,168,62,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(194,168,62,0.6)] hover:brightness-105 md:text-lg">
  Quero uma das 30 vagas
  <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
</Link>
          </div>
          <p className="mt-5 text-sm text-[#F1F7ED]/60">Acesso 100% gratuito. Sem cartão de crédito.</p>
        </ScrollReveal>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-white px-6 py-14 border-t border-[#243E36]/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Image src="/logo.png" alt="Revyza Logo" width={100} height={28} className="object-contain mb-1" />
            <p className="text-sm text-[#243E36]/70">Feito pra você focar no que importa: estudar.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#243E36]/75">
            <a className="transition-colors hover:text-[#7CA982]" href="mailto:seuemail@exemplo.com">Falar com o Fundador</a>
            <a className="transition-colors hover:text-[#7CA982]" href="https://wa.me/seulinkdegrupo" target="_blank" rel="noopener noreferrer">Comunidade VIP</a>
            <Link className="transition-colors hover:text-[#7CA982]" href="#">Termos e Privacidade</Link>
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-6xl border-t border-[#243E36]/10 pt-6 text-xs text-[#243E36]/55">
          © 2026 Revyza. Feito de estudante para estudante.
        </p>
      </footer>
    </main>
  );
}