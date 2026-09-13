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
  BarChart2, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  User,
  Bell,
  Clock,
  BookMarked,
  ArrowLeft
} from 'lucide-react'

const navigation = [
  { 
    id: 'inicio', 
    name: 'Início', 
    href: '/dashboard',
    icon: LayoutGrid 
  },
  { 
    id: 'estudar', 
    name: 'Estudar', 
    icon: BookOpen,
    subItems: [
      { id: 'timer', name: 'Timer', href: '/dashboard/timer' },
      { id: 'materias', name: 'Minhas matérias', href: '/dashboard/materias' },
      { id: 'historico', name: 'Histórico', href: '#' }
    ]
  },
  { 
    id: 'planejamento', 
    name: 'Planejamento', 
    icon: Calendar,
    subItems: [
      { id: 'meu-plano', name: 'Meu plano', href: '#' },
      { id: 'calendario', name: 'Calendário', href: '/dashboard/calendario' },
      { id: 'objetivo', name: 'Objetivo', href: '#' }
    ]
  },
  { 
    id: 'desempenho', 
    name: 'Desempenho', 
    icon: BarChart2,
    subItems: [
      { id: 'visao-geral', name: 'Visão geral', href: '/dashboard/estatisticas' },
      { id: 'evolucao', name: 'Evolução', href: '#' },
      { id: 'caderno-erros', name: 'Caderno de erros', href: '/dashboard/caderno' }
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<string>('inicio')
  
  const [userName, setUserName] = useState('Carregando...')
  const [userInitials, setUserInitials] = useState('--')

  useEffect(() => {
    const savedState = localStorage.getItem('revyza-sidebar-minimized')
    if (savedState === 'true') {
      setIsMinimized(true)
    }
  }, [])

  const toggleMinimize = () => {
    const newValue = !isMinimized
    setIsMinimized(newValue)
    localStorage.setItem('revyza-sidebar-minimized', String(newValue))
  }

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

  const handleGroupClick = (e: React.MouseEvent, item: typeof navigation[0]) => {
    if (item.subItems) {
      e.preventDefault()
      setExpandedGroup(expandedGroup === item.id ? null : item.id)
      if (window.innerWidth < 768 && !isMobileDrawerOpen) {
        setIsMobileDrawerOpen(true)
      }
    } else {
      setActiveItem(item.id)
      setExpandedGroup(null)
      setIsMobileDrawerOpen(false)
    }
  }

  const handleSubItemClick = (e: React.MouseEvent, subItemId: string) => {
    setActiveItem(subItemId)
    setIsMobileDrawerOpen(false)
  }

  const renderNavItems = () => (
    <ul className="space-y-1.5 px-4">
      {navigation.map((item) => {
        const isExpanded = expandedGroup === item.id
        const isActiveGroup = expandedGroup === item.id || activeItem === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeItem))
        
        const GroupContainer = item.href ? Link : 'button'
        
        return (
          <li key={item.id} className="flex flex-col">
            <GroupContainer
              href={item.href || '#'}
              onClick={(e: any) => handleGroupClick(e, item)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                isActiveGroup || isExpanded
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActiveGroup || isExpanded ? 'text-primary-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.subItems && (
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary-600' : 'text-slate-400'}`} />
              )}
            </GroupContainer>

            {item.subItems && (
              <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden flex flex-col gap-0.5 ml-10 border-l border-slate-100 pl-3">
                  {item.subItems.map((sub) => {
                    const isSubActive = activeItem === sub.id
                    return (
                      <Link
                        key={sub.id}
                        href={sub.href}
                        onClick={(e) => handleSubItemClick(e, sub.id)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          isSubActive
                            ? 'text-primary-700 bg-primary-50/50'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {sub.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      {isMobileDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 z-[70] transition-opacity"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-5 z-40">
        <Image src="/logo.png" alt="Revyza Logo" width={110} height={32} className="object-contain" priority />
        <button onClick={() => setIsMobileDrawerOpen(true)} className="p-2 -mr-2 text-slate-600 hover:text-primary-600 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-40 pb-safe">
        {navigation.map((item) => {
          const isActive = activeItem === item.id || expandedGroup === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeItem))
          const NavContainer = item.href ? Link : 'button'
          
          return (
            <NavContainer
              key={item.id}
              href={item.href || '#'}
              onClick={(e: any) => handleGroupClick(e, item)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className={`text-[10px] font-semibold ${isActive ? 'text-primary-700' : ''}`}>{item.name}</span>
            </NavContainer>
          )
        })}
      </nav>

      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileDrawerOpen(false)} />
          <div className="relative w-4/5 max-w-[320px] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right-full duration-300 ml-auto">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <span className="font-bold text-slate-900">Menu</span>
              <button onClick={() => setIsMobileDrawerOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5">
              <div className="mx-4 mb-6 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600 flex-shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Complete seu perfil</h4>
                  <p className="text-xs text-amber-700 mt-1 font-medium leading-relaxed">Faltam algumas informações para personalizarmos sua trilha.</p>
                </div>
              </div>

              {renderNavItems()}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Link href="/dashboard/configuracoes" onClick={() => setIsMobileDrawerOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200">
                <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  {userInitials}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="font-bold text-sm text-slate-900 truncate">{userName}</p>
                  <p className="text-xs text-slate-500 font-medium">Ver perfil</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <aside className={`
        hidden md:flex flex-col h-[100dvh] z-[40] flex-shrink-0 relative
        ${isMinimized ? 'w-24' : 'w-72'}
        bg-white border-r border-slate-200 transition-all duration-300
      `}>
        <button 
          onClick={toggleMinimize}
          className="absolute -right-3 top-8 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-primary-600 shadow-sm z-50 transition-colors"
        >
          {isMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={`h-24 flex items-center px-6 pt-2 overflow-hidden ${isMinimized ? 'justify-center' : 'justify-start'}`}>
          {isMinimized ? (
            <Image src="/icon.png" alt="Revyza Icon" width={40} height={40} className="object-contain" priority />
          ) : (
            <Image src="/logo.png" alt="Revyza Logo" width={140} height={40} className="object-contain scale-110 origin-left" priority />
          )}
        </div>

        <nav className="flex-1 mt-4 overflow-y-auto overflow-x-hidden">
          {isMinimized ? (
            <ul className="space-y-3 px-4 flex flex-col items-center">
              {navigation.map((item) => {
                const isActiveGroup = expandedGroup === item.id || activeItem === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeItem))
                const MinimizedContainer = item.href ? Link : 'button'
                
                return (
                  <li key={item.id} className="w-full flex justify-center">
                    <MinimizedContainer
                      href={item.href || '#'}
                      onClick={(e: any) => handleGroupClick(e, item)}
                      title={item.name}
                      className={`p-3 rounded-xl transition-all ${isActiveGroup ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                    >
                      <item.icon className="w-5 h-5" />
                    </MinimizedContainer>
                  </li>
                )
              })}
            </ul>
          ) : (
            renderNavItems()
          )}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-100 flex flex-col gap-1">
          <Link href="/dashboard/configuracoes" className={`flex items-center gap-3 p-2.5 rounded-xl font-medium transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900 ${isMinimized ? 'justify-center' : ''}`}>
            <User className="w-5 h-5 text-slate-400" />
            {!isMinimized && <span>Meu Perfil</span>}
          </Link>
          <Link href="/dashboard/configuracoes" className={`flex items-center gap-3 p-2.5 rounded-xl font-medium transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900 ${isMinimized ? 'justify-center' : ''}`}>
            <Settings className="w-5 h-5 text-slate-400" />
            {!isMinimized && <span>Configurações</span>}
          </Link>
          
          <div className={`mt-2 flex items-center p-2 rounded-xl bg-slate-50/50 border border-slate-100 ${isMinimized ? 'justify-center' : 'gap-3'}`}>
            <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-xs">{userInitials}</span>
            </div>
            {!isMinimized && (
              <div className="overflow-hidden flex-1 pr-2">
                <p className="font-bold text-xs text-slate-900 truncate">{userName}</p>
                <p className="text-[10px] text-slate-500 font-medium">Estudante</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}