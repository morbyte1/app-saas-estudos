'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { 
  LayoutGrid, 
  BookOpen, 
  Calendar, 
  Clock, 
  BarChart2, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  Menu,
  X
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
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [userName, setUserName] = useState('Carregando...')
  const [userInitials, setUserInitials] = useState('--')

  // Recupera o estado salvo no navegador assim que o componente é montado
  useEffect(() => {
    const savedState = localStorage.getItem('revyza-sidebar-minimized')
    if (savedState === 'true') {
      setIsMinimized(true)
    }
  }, [])

  // Sincronização do Usuário Autenticado
  useEffect(() => {
    const supabase = createClient()

    const updateUserData = (user: any) => {
      if (user) {
        const full = user.user_metadata?.full_name || user.email || 'Estudante'
        const names = full.trim().split(' ').filter(Boolean)
        const first = names[0] || 'Estudante'
        const last = names.length > 1 ? names[names.length - 1] : ''
        
        setUserName(last ? `${first} ${last}` : first)

        let initials = ''
        if (last) {
          initials = `${first[0]}${last[0]}`.toUpperCase()
        } else {
          initials = first.substring(0, 2).toUpperCase()
        }
        setUserInitials(initials)
      }
    }

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      updateUserData(user)
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserData(session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fecha o menu mobile automaticamente ao trocar de tela
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Função para alternar e salvar a preferência no localStorage
  const toggleMinimize = () => {
    const newValue = !isMinimized
    setIsMinimized(newValue)
    localStorage.setItem('revyza-sidebar-minimized', String(newValue))
  }

  // Identifica se é uma página interna profunda (ex: /dashboard/materias/[materia])
  const isDeepLink = pathname.split('/').filter(Boolean).length > 2

  return (
    <>
      {/* CABEÇALHO MOBILE (Visível apenas em telas menores que 'md') */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4 shadow-sm">
        <Image src="/icon.png" width={32} height={32} alt="Logo" className="object-contain" />
        <div className="flex items-center gap-1">
          {/* Botão de voltar realocado para o header mobile */}
          {isDeepLink && (
            <button 
              onClick={() => router.back()}
              className="p-2 text-slate-600 hover:text-primary-600 focus:outline-none"
              title="Voltar"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <button 
            onClick={() => setIsMobileOpen(true)} 
            className="p-2 text-slate-600 hover:text-primary-600 focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* OVERLAY MOBILE */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* BARRA LATERAL (Sidebar) */}
      <aside className={`
        fixed md:relative top-0 left-0 h-screen z-50 flex-shrink-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isMinimized ? 'md:w-24' : 'md:w-64'} w-72
        bg-white border-r border-slate-200 flex flex-col transition-all duration-300
      `}>
        {/* Botão de Minimizar/Maximizar (Apenas Desktop) */}
        <button 
          onClick={toggleMinimize}
          className="hidden md:block absolute -right-3 top-8 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-primary-600 shadow-sm z-30 transition-colors"
        >
          {isMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className={`pt-6 pb-4 flex items-center h-24 overflow-hidden px-6 ${isMinimized ? 'md:px-2 md:justify-center' : 'justify-between'}`}>
          <div className="flex items-center justify-center">
            {isMinimized ? (
              <Image
                src="/icon.png"
                alt="Logo R"
                width={40}
                height={40}
                priority
                className="w-10 h-10 object-contain hidden md:block"
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
            {/* Força exibir a Logo inteira no mobile caso isMinimized venha ativado do cache */}
            {isMobileOpen && isMinimized && (
              <Image
                src="/logo.png"
                alt="Logo do Focus App"
                width={180}
                height={60}
                priority
                className="w-44 h-auto object-contain -my-4 scale-110 md:hidden block"
              />
            )}
          </div>
          {/* Botão fechar no mobile */}
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 mt-2 flex flex-col gap-2 overflow-y-auto">
          {/* Botão de Voltar Contextual (Oculto no mobile, aparece apenas no desktop) */}
          {isDeepLink && (
            <div className={`hidden md:block mb-2 mx-4 ${isMinimized ? 'md:flex md:justify-center' : ''}`}>
              <button 
                onClick={() => router.back()} 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-primary-600 transition-colors font-medium text-sm w-full ${isMinimized ? 'md:justify-center md:px-0' : ''}`}
                title="Voltar para a tela anterior"
              >
                <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                {(!isMinimized || isMobileOpen) && <span>Voltar</span>}
              </button>
            </div>
          )}

          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard' 
                : pathname.startsWith(item.href)
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={isMinimized ? item.name : undefined}
                    className={`flex items-center gap-3 py-3 mx-4 rounded-xl font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-slate-500 hover:bg-slate-50'
                    } ${isMinimized ? 'md:justify-center md:px-0' : 'px-4'}`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : ''}`} />
                    {(!isMinimized || isMobileOpen) && <span>{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Perfil e Configurações */}
        <div className="mt-auto p-4 border-t border-slate-100">
          <div className={`flex items-center ${isMinimized ? 'md:flex-col md:gap-4 md:justify-center justify-between' : 'justify-between'}`}>
            <div className={`flex items-center gap-3 ${isMinimized ? 'md:justify-center' : ''}`}>
              <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-sm">{userInitials}</span>
              </div>
              {(!isMinimized || isMobileOpen) && (
                <div className="overflow-hidden">
                  <p className="font-medium text-slate-900 truncate">{userName}</p>
                  <p className="text-xs text-slate-500">Estudante</p>
                </div>
              )}
            </div>
            <Link 
              href="/dashboard/configuracoes"
              className={`p-2 text-slate-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-slate-50 ${pathname.startsWith('/dashboard/configuracoes') ? 'bg-primary-50 text-primary-600' : ''}`}
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}