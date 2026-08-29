'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { LayoutGrid, BookOpen, Calendar, Clock, BarChart2, Settings } from 'lucide-react'

const navigation = [
  { name: 'Painel Geral', href: '/dashboard', icon: LayoutGrid },
  { name: 'Timer', href: '/dashboard/timer', icon: Clock },
  { name: 'Minhas Matérias', href: '/dashboard/materias', icon: BookOpen },
  { name: 'Calendário', href: '/dashboard/calendario', icon: Calendar },
  { name: 'Estatísticas', href: '/dashboard/estatisticas', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Logo do Focus App"
            width={180}
            height={60}
            priority
            className="w-40 h-auto object-contain"
          />
        </div>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 mx-4 rounded-xl font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto p-6 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-slate-600 font-semibold">LS</span>
            </div>
            <div>
              <p className="font-medium text-slate-900">Lucas Silva</p>
              <p className="text-xs text-slate-500">Estudante</p>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}