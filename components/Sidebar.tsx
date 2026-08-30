'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  LayoutGrid, 
  BookOpen, 
  Calendar, 
  Clock, 
  BarChart2, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft 
} from 'lucide-react'

const navigation = [
  { name: 'Painel Geral', href: '/dashboard', icon: LayoutGrid },
  { name: 'Timer', href: '/dashboard/timer', icon: Clock },
  { name: 'Minhas Matérias', href: '/dashboard/materias', icon: BookOpen },
  { name: 'Calendário', href: '/dashboard/calendario', icon: Calendar },
  { name: 'Estatísticas', href: '/dashboard/estatisticas', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMinimized, setIsMinimized] = useState(false)

  // Recupera o estado salvo no navegador assim que o componente é montado
  useEffect(() => {
    const savedState = localStorage.getItem('revyza-sidebar-minimized')
    if (savedState === 'true') {
      setIsMinimized(true)
    }
  }, [])

  // Função para alternar e salvar a preferência no localStorage
  const toggleMinimize = () => {
    const newValue = !isMinimized
    setIsMinimized(newValue)
    localStorage.setItem('revyza-sidebar-minimized', String(newValue))
  }

  // Identifica se é uma página interna profunda (ex: /dashboard/materias/[materia])
  const isDeepLink = pathname.split('/').filter(Boolean).length > 2

  return (
    <aside className={`${isMinimized ? 'w-24' : 'w-64'} h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative z-20 flex-shrink-0`}>
      {/* Botão de Minimizar/Maximizar */}
      <button 
        onClick={toggleMinimize}
        className="absolute -right-3 top-8 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-primary-600 shadow-sm z-30 transition-colors"
      >
        {isMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Logo */}
      <div className={`pt-6 pb-4 flex items-center justify-center h-24 overflow-hidden ${isMinimized ? 'px-2' : 'px-6'}`}>
        {isMinimized ? (
          <Image
            src="/icon.png"
            alt="Logo R"
            width={40}
            height={40}
            priority
            className="w-10 h-10 object-contain"
          />
        ) : (
          <Image
            src="/logo.png"
            alt="Logo do Focus App"
            width={180}
            height={60}
            priority
            className="w-44 h-auto object-contain -my-4 scale-110"
          />
        )}
      </div>

      <nav className="flex-1 mt-2 flex flex-col gap-2 overflow-y-auto">
        {/* Botão de Voltar Contextual (Aparece apenas em rotas profundas) */}
        {isDeepLink && (
          <div className={`mb-2 mx-4 ${isMinimized ? 'flex justify-center' : ''}`}>
            <button 
              onClick={() => router.back()} 
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-primary-600 transition-colors font-medium text-sm w-full ${isMinimized ? 'justify-center px-0' : ''}`}
              title="Voltar para a tela anterior"
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
              {!isMinimized && <span>Voltar</span>}
            </button>
          </div>
        )}

        <ul className="space-y-1">
          {navigation.map((item) => {
            // Correção do bug: Garante que a raiz (/dashboard) seja exata e as sub-rotas validem com startsWith
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard' 
              : pathname.startsWith(item.href)
            
            return (
              <li key={item.name}>
                {/* Substituição do <a> pelo <Link> nativo do Next.js para navegação SPA sem reload */}
                <Link
                  href={item.href}
                  title={isMinimized ? item.name : undefined}
                  className={`flex items-center gap-3 py-3 mx-4 rounded-xl font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-slate-500 hover:bg-slate-50'
                  } ${isMinimized ? 'justify-center px-0' : 'px-4'}`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : ''}`} />
                  {!isMinimized && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Perfil e Configurações */}
      <div className="mt-auto p-4 border-t border-slate-100">
        <div className={`flex items-center ${isMinimized ? 'flex-col gap-4 justify-center' : 'justify-between'}`}>
          <div className={`flex items-center gap-3 ${isMinimized ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-slate-600 font-semibold">LS</span>
            </div>
            {!isMinimized && (
              <div className="overflow-hidden">
                <p className="font-medium text-slate-900 truncate">Lucas Silva</p>
                <p className="text-xs text-slate-500">Estudante</p>
              </div>
            )}
          </div>
          <button 
            className={`p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50 ${isMinimized ? '' : ''}`}
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}