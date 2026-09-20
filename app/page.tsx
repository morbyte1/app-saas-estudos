import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import Navbar from '@/components/landing/Navbar'
import { Hero, Fragmentation, Intelligence, Integration } from '@/components/landing/Intro'
import ProductShowcase from '@/components/landing/ProductShowcase'
import { Insights, BeforeAfter, Trust, Pricing, FinalCTA, Footer } from '@/components/landing/Closing'
import FAQ from '@/components/landing/FAQ'
import './landing.css'

const outfit = Outfit({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Revyza | Seu sistema de estudo pessoal',
  description: 'Estude onde quiser. O Revyza conecta planejamento, estudo, questões, erros e desempenho para ajudar você a entender o que fazer depois.',
  openGraph: {
    title: 'Revyza | Seu sistema de estudo pessoal',
    description: 'Estude onde quiser. Entenda o que fazer depois.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function LandingPage() {
  return <div className={`revyza-landing min-w-0 overflow-x-clip bg-[#14251f] text-[#F1F7ED] antialiased ${outfit.className}`}>
    <Navbar />
    <main>
      <Hero />
      <Fragmentation />
      <Intelligence />
      <Integration />
      <ProductShowcase />
      <Insights />
      <BeforeAfter />
      <Trust />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </main>
    <Footer />
  </div>
}
