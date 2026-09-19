import Sidebar from '@/components/Sidebar'
import type { Viewport } from 'next'

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar />
      <main id="main-scroll-container" className="min-w-0 flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
        {children}
      </main>
    </div>
  )
}
