'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { LucideIcon } from 'lucide-react'
import { LayoutGrid, BookOpen, Calendar, BarChart2, MoreHorizontal, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react'

type NavItem = { id: string; name: string; icon: LucideIcon; href?: string; subItems?: { id: string; name: string; href: string }[] }

const navigation: NavItem[] = [
  { id: 'inicio', name: 'Início', icon: LayoutGrid, href: '/painel' },
  { id: 'estudar', name: 'Estudar', icon: BookOpen, subItems: [
    { id: 'timer', name: 'Timer', href: '/painel/timer' },
    { id: 'materias', name: 'Minhas matérias', href: '/painel/materias' },
    { id: 'historico', name: 'Histórico', href: '/painel/historico' },
  ] },
  { id: 'planejamento', name: 'Planejamento', icon: Calendar, subItems: [
    { id: 'meu-plano', name: 'Meu plano', href: '/painel/meu-plano' },
    { id: 'calendario', name: 'Calendário', href: '/painel/calendario' },
    { id: 'objetivo', name: 'Objetivo', href: '/painel/objetivo' },
  ] },
  { id: 'desempenho', name: 'Desempenho', icon: BarChart2, subItems: [
    { id: 'visao-geral', name: 'Visão geral', href: '/painel/estatisticas' },
    { id: 'caderno-erros', name: 'Caderno de erros', href: '/painel/caderno' },
  ] },
  { id: 'mais', name: 'Mais', icon: MoreHorizontal, subItems: [
    { id: 'configuracoes', name: 'Configurações/perfil', href: '/painel/configuracoes' },
  ] },
]

const matchesPath = (pathname: string, href: string) => pathname === href || (href !== '/painel' && pathname.startsWith(`${href}/`))

export default function Sidebar() {
  const pathname = usePathname()
  const activeGroup = navigation.find(item => item.subItems?.some(sub => matchesPath(pathname, sub.href)))?.id ?? null
  const [isMinimized, setIsMinimized] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<{ path: string; id: string } | null>(null)
  const [flyout, setFlyout] = useState<{ path: string; id: string } | null>(null)
  const [desktopGroup, setDesktopGroup] = useState<{ path: string; id: string | null } | null>(null)
  const [userName, setUserName] = useState('Carregando...')
  const [userInitials, setUserInitials] = useState('--')

  const openMobileId = mobilePanel?.path === pathname ? mobilePanel.id : null
  const openFlyoutId = flyout?.path === pathname ? flyout.id : null
  const expandedGroup = desktopGroup?.path === pathname ? desktopGroup.id : activeGroup
  const mobileItem = navigation.find(item => item.id === openMobileId)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsMinimized(localStorage.getItem('revyza-sidebar-minimized') === 'true'), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMobilePanel(null)
      setFlyout(null)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    const updateUserData = (user: User | null) => {
      if (!user) return
      const full = user.user_metadata?.full_name || user.email || 'Estudante'
      const names = full.trim().split(' ').filter(Boolean)
      const first = names[0] || 'Estudante'
      const last = names.length > 1 ? names[names.length - 1] : ''
      setUserName(last ? `${first} ${last}` : first)
      setUserInitials((last ? `${first[0]}${last[0]}` : first.slice(0, 2)).toUpperCase())
    }
    supabase.auth.getUser().then(({ data }) => updateUserData(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => updateUserData(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const toggleMinimize = () => {
    setIsMinimized(value => {
      localStorage.setItem('revyza-sidebar-minimized', String(!value))
      return !value
    })
    setFlyout(null)
  }

  const subLinks = (item: NavItem, close: () => void) => item.subItems?.map(sub => (
    <Link key={sub.id} href={sub.href} onClick={close} aria-current={matchesPath(pathname, sub.href) ? 'page' : undefined}
      className={`block rounded-lg px-3 py-2 text-sm font-medium ${matchesPath(pathname, sub.href) ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}>
      {sub.name}
    </Link>
  ))

  return (
    <>
      {openMobileId && mobileItem && <>
        <button aria-label="Fechar navegação" className="lg:hidden fixed inset-0 z-40 bg-slate-900/30" onClick={() => setMobilePanel(null)} />
        <div className="lg:hidden fixed inset-x-0 z-50 rounded-t-2xl border border-slate-200 bg-white p-4 shadow-xl" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
          <p className="mb-2 px-3 text-sm font-bold text-slate-900">{mobileItem.id === 'mais' ? 'Configurações/perfil' : mobileItem.name}</p>
          <nav aria-label={`Páginas de ${mobileItem.name}`}>{subLinks(mobileItem, () => setMobilePanel(null))}</nav>
        </div>
      </>}

      <nav aria-label="Navegação principal" className="lg:hidden fixed inset-x-0 bottom-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom,0px))] items-start border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom,0px)]">
        {navigation.map(item => {
          const active = item.href ? pathname === item.href : activeGroup === item.id
          const selected = openMobileId === item.id || (!openMobileId && active)
          const className = `flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 ${selected ? 'text-primary-700' : 'text-slate-500'}`
          return item.href ? (
            <Link key={item.id} href={item.href} onClick={() => setMobilePanel(null)} aria-current={active ? 'page' : undefined} className={className}>
              <item.icon className="h-5 w-5" /><span className="text-[10px] font-semibold">{item.name}</span>
            </Link>
          ) : (
            <button key={item.id} type="button" aria-expanded={openMobileId === item.id} onClick={() => setMobilePanel(openMobileId === item.id ? null : { path: pathname, id: item.id })} className={className}>
              <item.icon className="h-5 w-5" /><span className="text-[10px] font-semibold">{item.name}</span>
            </button>
          )
        })}
      </nav>

      {openFlyoutId && <button aria-label="Fechar subpáginas" className="hidden lg:block fixed inset-0 z-40" onClick={() => setFlyout(null)} />}
      <aside className={`relative z-50 hidden h-[100dvh] shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-300 motion-reduce:transition-none lg:flex ${isMinimized ? 'w-24' : 'w-72'}`}>
        <button type="button" onClick={toggleMinimize} aria-label={isMinimized ? 'Expandir navegação' : 'Minimizar navegação'} className="absolute -right-3 top-8 z-50 rounded-full border border-slate-200 bg-white p-1 text-slate-500 shadow-sm">
          {isMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <div className="relative h-24 shrink-0 overflow-hidden" role="img" aria-label="Revyza">
          <div aria-hidden="true" className={`absolute left-0 top-0 flex h-24 w-24 items-center justify-center motion-safe:transition-opacity motion-safe:duration-100 motion-reduce:delay-0 ${isMinimized ? 'opacity-100' : 'opacity-0 motion-safe:delay-200'}`}>
            <Image src="/icon.png" alt="" width={40} height={40} priority className="h-10 w-10 shrink-0 object-contain" />
          </div>
          <div aria-hidden="true" className={`absolute inset-0 flex items-center justify-center motion-safe:transition-opacity motion-safe:duration-100 motion-reduce:delay-0 ${isMinimized ? 'opacity-0' : 'opacity-100 motion-safe:delay-200'}`}>
            <Image src="/logo.png" alt="" width={224} height={224} priority className="h-56 w-56 max-w-none shrink-0" />
          </div>
        </div>
        <nav aria-label="Navegação lateral" className={`mt-4 flex-1 ${isMinimized ? 'overflow-visible' : 'overflow-y-auto'}`}>
          <ul className="space-y-1 px-4">
            {navigation.map(item => {
              const active = item.href ? pathname === item.href : activeGroup === item.id
              const expanded = expandedGroup === item.id
              const rowClass = `flex w-full items-center rounded-xl px-3 py-2.5 font-medium ${active ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`
              return <li key={item.id} className="relative">
                {item.href ? (
                  <Link href={item.href} title={item.name} aria-current={active ? 'page' : undefined} onClick={() => setFlyout(null)} className={`${rowClass} ${isMinimized ? 'justify-center' : ''}`}>
                    <item.icon className="h-5 w-5 shrink-0" />{!isMinimized && <span className="ml-3">{item.name}</span>}
                  </Link>
                ) : (
                  <button type="button" title={item.name} aria-expanded={isMinimized ? openFlyoutId === item.id : expanded} onClick={() => isMinimized ? setFlyout(openFlyoutId === item.id ? null : { path: pathname, id: item.id }) : setDesktopGroup({ path: pathname, id: expanded ? null : item.id })} className={`${rowClass} ${isMinimized ? 'justify-center' : ''}`}>
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isMinimized && <><span className="ml-3 flex-1 text-left">{item.id === 'mais' ? 'Configurações/perfil' : item.name}</span><ChevronDown className={`h-4 w-4 ${expanded ? 'rotate-180' : ''}`} /></>}
                  </button>
                )}
                {!isMinimized && item.subItems && expanded && <div className="ml-10 border-l border-slate-100 pl-3">{subLinks(item, () => setFlyout(null))}</div>}
                {isMinimized && item.subItems && openFlyoutId === item.id && (
                  <div className="absolute left-full top-0 z-50 ml-3 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    <p className="px-3 py-2 text-sm font-bold text-slate-900">{item.id === 'mais' ? 'Configurações/perfil' : item.name}</p>
                    {subLinks(item, () => setFlyout(null))}
                  </div>
                )}
              </li>
            })}
          </ul>
        </nav>
        <div className={`border-t border-slate-100 p-4 ${isMinimized ? 'text-center' : ''}`}>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">{userInitials}</span>
          {!isMinimized && <span className="ml-3 text-xs font-semibold text-slate-700">{userName}</span>}
        </div>
      </aside>
    </>
  )
}
