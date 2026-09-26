import Image, { type StaticImageData } from 'next/image'
import { ImageIcon } from 'lucide-react'
import cadernoScreenshot from '@/public/screenshots/caderno.png'
import dashboardOverviewScreenshot from '@/public/screenshots/dashboard1.png'
import dashboardNextStepScreenshot from '@/public/screenshots/dashboard2.png'
import desempenhoScreenshot from '@/public/screenshots/estatisticas.png'
import materiasScreenshot from '@/public/screenshots/materia.png'
import timerScreenshot from '@/public/screenshots/timer.png'

const fullWidthSizes = '(max-width: 639px) calc(100vw - 56px), (max-width: 1343px) calc(100vw - 88px), 1256px'
const halfColumnSizes = '(max-width: 639px) calc(100vw - 56px), (max-width: 1023px) calc(100vw - 88px), (max-width: 1343px) calc(50vw - 88px), 584px'
const dashboardColumnSizes = '(max-width: 639px) calc(100vw - 56px), (max-width: 1023px) calc(100vw - 88px), (max-width: 1343px) calc(62.5vw - 104px), 736px'
const desempenhoColumnSizes = '(max-width: 639px) calc(100vw - 56px), (max-width: 1023px) calc(100vw - 88px), (max-width: 1343px) calc(57.5vw - 98px), 675px'
const planningColumnSizes = '(max-width: 639px) calc(100vw - 56px), (max-width: 1023px) calc(100vw - 88px), (max-width: 1343px) calc(50vw - 66px), 606px'

type Screenshot = {
  label: string
  src: StaticImageData | null
  alt: string
  sizes: string
}

const screenshots = {
  dashboardOverview: {
    label: 'Dashboard',
    src: dashboardOverviewScreenshot,
    alt: 'Visão geral do Dashboard do Revyza com contexto e desempenho dos estudos',
    sizes: fullWidthSizes,
  },
  dashboardNextStep: {
    label: 'Dashboard — Próximo passo',
    src: dashboardNextStepScreenshot,
    alt: 'Dashboard do Revyza mostrando o próximo passo recomendado para os estudos',
    sizes: dashboardColumnSizes,
  },
  timer: {
    label: 'Timer',
    src: timerScreenshot,
    alt: 'Timer do Revyza com registro da sessão de estudo',
    sizes: halfColumnSizes,
  },
  materias: {
    label: 'Minhas Matérias',
    src: materiasScreenshot,
    alt: 'Detalhe de uma matéria no Revyza com tópicos e assuntos',
    sizes: halfColumnSizes,
  },
  calendario: {
    label: 'Calendário',
    src: null,
    alt: 'Calendário do Revyza com atividades planejadas',
    sizes: planningColumnSizes,
  },
  plano: {
    label: 'Meu Plano',
    src: null,
    alt: 'Meu Plano com disponibilidade e metas de estudo',
    sizes: planningColumnSizes,
  },
  desempenho: {
    label: 'Desempenho',
    src: desempenhoScreenshot,
    alt: 'Visão geral de desempenho no Revyza',
    sizes: desempenhoColumnSizes,
  },
  caderno: {
    label: 'Caderno de Erros',
    src: cadernoScreenshot,
    alt: 'Caderno de Erros do Revyza com erros e revisões',
    sizes: halfColumnSizes,
  },
} satisfies Record<string, Screenshot>

type ScreenshotId = keyof typeof screenshots

export default function ProductScreenshot({ id, className = '', preload = false }: { id: ScreenshotId; className?: string; preload?: boolean }) {
  const shot = screenshots[id]

  return (
    <figure className={`overflow-hidden rounded-[22px] border border-[#E0EEC6]/15 bg-[#102019] p-2 shadow-[0_28px_80px_-35px_rgba(0,0,0,.65)] sm:rounded-[28px] sm:p-3 ${className}`}>
      <div className={`flex items-center justify-center overflow-hidden rounded-[15px] border border-[#E0EEC6]/10 bg-[radial-gradient(circle_at_50%_10%,rgba(124,169,130,.13),transparent_55%)] sm:rounded-[20px] ${shot.src ? '' : 'aspect-[1672/941]'}`}>
        {shot.src ? (
          <Image
            src={shot.src}
            alt={shot.alt}
            sizes={shot.sizes}
            quality={95}
            preload={preload}
            className="block h-auto w-full"
          />
        ) : (
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
