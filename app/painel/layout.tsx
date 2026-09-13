import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar />
      {/* Removido o animate-page e adicionado o id main-scroll-container */}
      <main id="main-scroll-container" className="flex-1 overflow-y-auto pt-16 md:pt-0">
        {children}
      </main>
    </div>
  )
}