'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import Brand from './Brand'
import { loginHref, signupHref } from './routes'

const links = [
  { label: 'Produto', href: '#produto' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Recursos', href: '#recursos' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#E0EEC6]/[.08] bg-[#0b1511]/90 backdrop-blur-xl">
      <nav aria-label="Navegação principal" className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Brand />
        <div className="hidden items-center gap-7 lg:flex">
          {links.map(link => <Link key={link.href} href={link.href} className="text-sm font-medium text-[#F1F7ED]/70 transition-colors hover:text-[#F1F7ED] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0EEC6]">{link.label}</Link>)}
        </div>
        <div className="hidden items-center gap-5 lg:flex">
          <Link href={loginHref} className="text-sm font-semibold text-[#F1F7ED]/85 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0EEC6]">Entrar</Link>
          <Link href={signupHref} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E0EEC6] px-5 text-sm font-bold text-[#243E36] transition-colors hover:bg-[#F1F7ED] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0EEC6]">Começar grátis <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
        </div>
        <button type="button" aria-controls="landing-mobile-menu" aria-expanded={open} aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(value => !value)} className="inline-flex size-11 items-center justify-center rounded-xl border border-[#E0EEC6]/20 text-[#F1F7ED] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0EEC6] lg:hidden">
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </nav>
      <div id="landing-mobile-menu" hidden={!open} className="border-t border-[#E0EEC6]/10 bg-[#0b1511] px-5 pb-6 pt-3 lg:hidden">
        <nav aria-label="Navegação mobile" className="mx-auto flex max-w-7xl flex-col">
          {links.map(link => <Link key={link.href} href={link.href} onClick={close} className="rounded-lg px-2 py-3 text-base font-medium text-[#F1F7ED]/85 focus-visible:outline-2 focus-visible:outline-[#E0EEC6]">{link.label}</Link>)}
          <div className="mt-3 flex flex-col gap-3 border-t border-[#E0EEC6]/10 pt-5 sm:flex-row">
            <Link href={loginHref} onClick={close} className="flex min-h-11 items-center justify-center rounded-full border border-[#E0EEC6]/25 px-5 font-semibold text-[#F1F7ED]">Entrar</Link>
            <Link href={signupHref} onClick={close} className="flex min-h-11 items-center justify-center rounded-full bg-[#E0EEC6] px-5 font-bold text-[#243E36]">Começar grátis</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
