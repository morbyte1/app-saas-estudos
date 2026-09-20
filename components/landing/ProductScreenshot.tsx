import Image from 'next/image'
import { ImageIcon } from 'lucide-react'

// Troque somente src de null pelo caminho indicado quando a captura real estiver em public/screenshots.
// Todas as imagens devem ter 1600 × 900 (16:9); preserve o alt descritivo já preparado.
const screenshots = {
  dashboardOverview: {
  label: 'Dashboard',
  src: '/screenshots/dashboard-overview.png',
  alt: 'Visão geral do Dashboard do Revyza com contexto e desempenho dos estudos',
  ratio: 'aspect-video'
},

dashboardNextStep: {
  label: 'Dashboard — Próximo passo',
  src: '/screenshots/dashboard-next-step.png',
  alt: 'Dashboard do Revyza mostrando o próximo passo recomendado para os estudos',
  ratio: 'aspect-video'
},
  timer: { label: 'Timer', src: null as string | null, alt: 'Timer do Revyza com registro da sessão de estudo', ratio: 'aspect-video' }, // /public/screenshots/timer.webp
  materias: { label: 'Minhas Matérias', src: null as string | null, alt: 'Detalhe de uma matéria no Revyza com tópicos e assuntos', ratio: 'aspect-video' }, // /public/screenshots/materias.webp
  calendario: { label: 'Calendário', src: null as string | null, alt: 'Calendário do Revyza com atividades planejadas', ratio: 'aspect-video' }, // /public/screenshots/calendario.webp
  plano: { label: 'Meu Plano', src: null as string | null, alt: 'Meu Plano com disponibilidade e metas de estudo', ratio: 'aspect-video' }, // /public/screenshots/meu-plano.webp
  desempenho: { label: 'Desempenho', src: null as string | null, alt: 'Visão geral de desempenho no Revyza', ratio: 'aspect-video' }, // /public/screenshots/desempenho.webp
  caderno: { label: 'Caderno de Erros', src: null as string | null, alt: 'Caderno de Erros do Revyza com erros e revisões', ratio: 'aspect-video' }, // /public/screenshots/caderno.webp
} as const

type ScreenshotId = keyof typeof screenshots

export default function ProductScreenshot({ id, className = '', priority = false }: { id: ScreenshotId; className?: string; priority?: boolean }) {
  const shot = screenshots[id]

  return (
    <figure className={`overflow-hidden rounded-[22px] border border-[#E0EEC6]/15 bg-[#102019] p-2 shadow-[0_28px_80px_-35px_rgba(0,0,0,.65)] sm:rounded-[28px] sm:p-3 ${className}`}>
      <div className={`relative flex ${shot.ratio} items-center justify-center overflow-hidden rounded-[15px] border border-[#E0EEC6]/10 bg-[radial-gradient(circle_at_50%_10%,rgba(124,169,130,.13),transparent_55%)] sm:rounded-[20px]`}>
        {shot.src ? <Image src={shot.src} alt={shot.alt} fill sizes="(max-width: 768px) 100vw, 70vw" priority={priority} className="object-contain" /> : (
          <div role="img" aria-label={`Espaço reservado para captura real: ${shot.label}`} className="flex flex-col items-center gap-3 px-5 text-center">
            <ImageIcon className="size-6 text-[#7CA982]/65" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E0EEC6]/75">Captura real: {shot.label}</span>
            <span className="text-xs text-[#F1F7ED]/40">Área reservada para a tela do produto</span>
          </div>
        )}
      </div>
    </figure>
  )
}
