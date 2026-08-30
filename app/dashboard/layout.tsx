import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      {/* Adicionado pt-16 apenas no mobile (md:pt-0) para acomodar o cabeçalho mobile do Sidebar */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">{children}</main>
    </div>
  )
}