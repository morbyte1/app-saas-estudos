"use client";

import { Dancing_Script } from "next/font/google";

const dancing = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
});
import {
  AlarmClockOff,
  ArrowRight,
  BarChart3,
  Check,
  LayoutList,
  Minus,
  PieChart,
  Timer,
  User,
} from "lucide-react";

/**
 * Revyza — Landing Page (Next.js App Router)
 * Cole este arquivo em: app/page.tsx (ou components/LandingPage.tsx)
 * Dependência única: lucide-react  ->  npm i lucide-react
 * Cores aplicadas inline via classes arbitrárias do Tailwind (não precisa configurar tema).
 * Paleta: cream #F1F7ED · forest #243E36 · sage #7CA982 · mist #E0EEC6 · gold #C2A83E
 */

const pillars = [
  {
    title: "Configure sua rotina em 3 cliques. Adeus, planilhas.",
    body: "Nada de templates complexos ou páginas em branco. Cadastre suas matérias, defina metas semanais e deixe o Revyza dizer exatamente o que você precisa focar hoje. A organização deixa de ser um evento e passa a ser invisível.",
    icon: LayoutList,
    placeholder: 'Espaço para print da aba "Minhas Matérias"',
  },
  {
    title: "Foco absoluto. Sem tocar no celular.",
    body: "Um Timer minimalista integrado diretamente ao seu ambiente de estudos. Escolha entre Pomodoro ou Cronômetro Progressivo. Quando o tempo acabar, registre quantas questões você fez e quantas errou ali mesmo. Sem notificações, sem distrações.",
    icon: Timer,
    placeholder: "Espaço para print do Timer",
  },
  {
    title: "Estude com métricas reais, não com intuição.",
    body: "Você foca em resolver a lista, nós cuidamos da matemática. O Revyza gera gráficos automáticos do seu tempo de estudo, aponta quais matérias estão sendo abandonadas e analisa o verdadeiro motivo dos seus erros. Você descobre seu ponto cego meses antes da prova.",
    icon: PieChart,
    placeholder: "Espaço para print de Estatísticas (gráfico de pizza)",
  },
];

const comparison = [
  {
    label: "Tempo de configuração",
    revyza: "Pronto em 3 cliques",
    sheets: "Horas assistindo tutoriais",
    timers: "Rápido, mas sem contexto",
  },
  {
    label: "Foco e retenção",
    revyza: "Ambiente blindado",
    sheets: 'Procrastinação "organizando"',
    timers: "Risco alto de abrir o feed",
  },
  {
    label: "Análise de erros",
    revyza: "Por matéria e motivo",
    sheets: "Fórmulas manuais complexas",
    timers: "Inexistente",
  },
  {
    label: "Métricas de evolução",
    revyza: "Gráficos automáticos",
    sheets: "Depende de você preencher",
    timers: "Apenas mostra o tempo total",
  },
];

export default function LandingPage() {
  return (
    <main className="scroll-smooth bg-[#F1F7ED] text-[#243E36] antialiased">
{/* 1. HERO (Agora Premium) */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16 sm:pt-28 md:pb-24">
        
        {/* EFEITO 2: Padrão de Pontilhados (Dot Pattern) cobrindo o fundo */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#d1d5db_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

        {/* EFEITO 1: Brilho Radial (Glow) atrás do texto */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[400px] bg-[#7CA982]/25 rounded-full blur-[80px] -z-0 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          
          {/* EFEITO 3: Prova Social (Avatares) */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#F1F7ED] bg-[#243E36] text-[10px] font-bold text-white shadow-sm">
                📚
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#F1F7ED] bg-[#7CA982] text-[10px] font-bold text-white shadow-sm">
                ⚡
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[#F1F7ED] bg-[#C2A83E] text-[10px] font-bold text-white shadow-sm">
                🎯
              </div>
            </div>
            <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-[#243E36] shadow-sm backdrop-blur-sm border border-[#243E36]/5">
              Mais de <strong className="text-[#7CA982]">20 estudantes</strong> já na fila
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-[#243E36] sm:text-5xl md:text-6xl drop-shadow-sm">
            Você foca na prova. O <span className={`text-[#7CA982] ${dancing.className} font-normal tracking-normal`}>Revyza</span> cuida da burocracia.
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#243E36]/75 md:text-xl">
            Sente-se e estude. Nós automatizamos o rastreio do seu tempo, calculamos sua
            precisão e dizemos exatamente onde você precisa melhorar.
          </p>
          
          <div className="mt-10">
            <a
              href="/login"
              className="group inline-flex items-center gap-3 rounded-2xl bg-[#7CA982] px-8 py-4 text-base font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,169,130,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(124,169,130,0.6)] hover:brightness-105 md:text-lg"
            >
              Quero focar de verdade
              <ArrowRight
                className="size-5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </a>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-16 max-w-6xl">
          {/* EFEITO EXTRA: Efeito de "Janela de Navegador" (Browser Mockup) para o Placeholder */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-[#243E36]/10 transition-transform duration-700 hover:-translate-y-2">
            {/* Barra superior do navegador fictício */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="size-2.5 rounded-full bg-red-400" />
              <div className="size-2.5 rounded-full bg-amber-400" />
              <div className="size-2.5 rounded-full bg-emerald-400" />
            </div>
            
            {/* O interior do print */}
            <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-[#F1F7ED]/50 p-8 text-center">
              <BarChart3 className="size-10 text-[#7CA982] animate-bounce" strokeWidth={1.5} aria-hidden />
              <span className="text-sm font-medium text-[#243E36]/70">
                Seu print do Dashboard virá aqui
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DOR */}
      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <AlarmClockOff className="size-10 text-[#C2A83E]" strokeWidth={1.5} aria-hidden />
          <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Você gasta mais tempo &quot;se organizando&quot; do que resolvendo questões?
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#243E36]/75">
            A falsa produtividade é o maior ralo de tempo do estudante moderno. Passar 3
            horas personalizando cores em um template de estudos não te aprova. Acertar
            questões, sim. O seu futuro não depende de fórmulas complexas do Excel.
          </p>
        </div>
      </section>

      {/* 3. COMO FUNCIONA */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#7CA982]">
            Como funciona
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Três pilares para uma rotina sem atrito.
          </h2>

          <div className="mt-16 space-y-20 md:space-y-28">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="grid items-center gap-10 md:grid-cols-2 md:gap-16"
                >
                  <div className={i % 2 === 1 ? "md:order-2" : ""}>
                    <div className="flex size-12 items-center justify-center rounded-xl bg-[#E0EEC6]">
                      <Icon className="size-6 text-[#243E36]" strokeWidth={1.75} aria-hidden />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
                      {pillar.title}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-[#243E36]/75 md:text-lg">
                      {pillar.body}
                    </p>
                  </div>

                  {/* Card de imagem (placeholder) */}
                  <div
                    className={`flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl bg-[#E0EEC6] p-8 text-center ring-1 ring-[#243E36]/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_24px_-12px_rgba(36,62,54,0.35)] ${
                      i % 2 === 1 ? "md:order-1" : ""
                    }`}
                  >
                    {/* <img src="/images/seu-print.png" alt={pillar.placeholder} className="h-full w-full rounded-2xl object-cover" /> */}
                    <Icon className="size-10 text-[#7CA982]" strokeWidth={1.5} aria-hidden />
                    <span className="text-sm font-medium text-[#243E36]/70">
                      {pillar.placeholder}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. TABELA COMPARATIVA */}
      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Por que o Revyza vence a sua planilha.
          </h2>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th className="w-1/4 pb-4" />
                  <th className="rounded-t-2xl bg-[#E0EEC6] px-6 pb-4 pt-5 text-base font-bold text-[#243E36]">
                    Revyza
                  </th>
                  <th className="px-6 pb-4 pt-5 text-base font-semibold text-[#243E36]/45">
                    Planilhas (Notion/Excel)
                  </th>
                  <th className="px-6 pb-4 pt-5 text-base font-semibold text-[#243E36]/45">
                    Apps de Timer
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.label} className="align-top">
                    <th className="border-t border-[#243E36]/10 py-5 pr-6 text-sm font-semibold text-[#243E36]">
                      {row.label}
                    </th>
                    <td
                      className={`bg-[#E0EEC6] px-6 py-5 text-sm font-semibold text-[#243E36] ${
                        i === comparison.length - 1 ? "rounded-b-2xl" : ""
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#7CA982]" aria-hidden />
                        {row.revyza}
                      </span>
                    </td>
                    <td className="border-t border-[#243E36]/10 px-6 py-5 text-sm text-[#243E36]/45">
                      <span className="flex items-start gap-2">
                        <Minus className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {row.sheets}
                      </span>
                    </td>
                    <td className="border-t border-[#243E36]/10 px-6 py-5 text-sm text-[#243E36]/45">
                      <span className="flex items-start gap-2">
                        <Minus className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {row.timers}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. CARTA DO FUNDADOR */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-[0_24px_60px_-24px_rgba(36,62,54,0.25)] ring-1 ring-[#243E36]/5 sm:p-12">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#E0EEC6] ring-1 ring-[#243E36]/10">
              {/* <img src="/images/arthur.jpg" alt="Arthur, fundador do Revyza" className="size-14 rounded-full object-cover" /> */}
              <User className="size-6 text-[#7CA982]" strokeWidth={1.5} aria-hidden />
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Por que eu criei o Revyza?
            </h2>
          </div>

          <div className="mt-8 space-y-5 text-lg leading-relaxed text-[#243E36]/85">
            <p>
              &quot;Como estudante, eu percebi que passava mais tempo lutando contra as
              minhas ferramentas de organização do que realmente estudando. O Notion tinha
              virado um buraco negro de templates complexos. As planilhas do Excel pareciam
              um trabalho de contabilidade. E tentar usar o cronômetro do celular só servia
              para me fazer abrir o Instagram e perder 40 minutos de foco.
            </p>
            <p>
              Eu cansei de tentar adaptar plataformas corporativas para a rotina caótica de
              quem precisa sentar, estudar e passar. Eu só queria um ambiente onde eu
              pudesse dar o play no cronômetro, ter a prova das minhas horas líquidas e
              saber exatamente o motivo dos meus erros, sem atrito.
            </p>
            <p>
              Como não encontrei essa ferramenta, resolvi sentar e programar eu mesmo. O
              Revyza não é de uma megacorporação do Vale do Silício. É um projeto solo,
              feito por quem estuda, para quem estuda. Hoje, estou abrindo a plataforma para
              30 pessoas testarem comigo e ajudarem a decidir o futuro do aplicativo. Bora
              estudar juntos?&quot;
            </p>
          </div>

          <p className="mt-8 text-sm font-semibold text-[#243E36]">
            Arthur, Fundador e Desenvolvedor Solo.
          </p>
        </div>
      </section>

      {/* 6. CTA FINAL */}
      <section id="garantir-vaga" className="bg-[#243E36] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F1F7ED] sm:text-5xl">
            Faça parte dos 30 primeiros.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#F1F7ED]/80">
            O Revyza está em fase Beta fechada. Para garantir que o sistema rode com extrema
            velocidade e que eu consiga conversar com todos no grupo de feedbacks, estou
            liberando o acesso gratuito apenas para a nossa primeira tropa de 30 testadores.
            Se você quer parar de brigar com planilhas e começar a focar na aprovação, ocupe
            o seu lugar.
          </p>
          <div className="mt-10">
            <a
              href="#garantir-vaga"
              className="group inline-flex items-center gap-3 rounded-2xl bg-[#C2A83E] px-8 py-4 text-base font-bold text-[#243E36] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 md:text-lg"
            >
              Quero ser um dos 30 testadores
              <ArrowRight
                className="size-5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </a>
          </div>
          <p className="mt-5 text-sm text-[#F1F7ED]/60">
            Acesso 100% gratuito. Sem cartão de crédito.
          </p>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="px-6 py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xl font-extrabold">Revyza</p>
            <p className="mt-2 text-sm text-[#243E36]/70">
              O ecossistema blindado para a sua aprovação.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#243E36]/75">
            <a className="transition-colors hover:text-[#7CA982]" href="#garantir-vaga">
              Falar com o Fundador
            </a>
            <a className="transition-colors hover:text-[#7CA982]" href="#garantir-vaga">
              Comunidade VIP
            </a>
            <a className="transition-colors hover:text-[#7CA982]" href="#garantir-vaga">
              Termos e Privacidade
            </a>
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-6xl border-t border-[#243E36]/10 pt-6 text-xs text-[#243E36]/55">
          © 2026 Revyza. Feito de estudante para estudante.
        </p>
      </footer>
    </main>
  );
}
