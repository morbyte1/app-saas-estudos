import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Alterado h-screen para h-[100dvh]
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar />
      {/* Adicionado animate-page na tag main para animar todas as transições de rota internamente */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 animate-page">{children}</main>
    </div>
  )
}