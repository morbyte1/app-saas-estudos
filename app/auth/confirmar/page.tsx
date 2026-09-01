'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useTransition, Suspense } from 'react'
import Image from 'next/image'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { verifyTokenAction } from './actions'

function ConfirmarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  const handleConfirm = () => {
    if (!token_hash || !type) {
      setError('Parâmetros de autenticação inválidos ou ausentes.')
      return
    }

    startTransition(async () => {
      const res = await verifyTokenAction(token_hash, type, next)
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  if (error) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="bg-red-100 p-4 rounded-full mb-6 text-red-600">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ops, ocorreu um erro</h1>
        <p className="text-slate-500 mb-8 font-medium">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition shadow-md"
        >
          Voltar para o Login
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="bg-primary-100 p-4 rounded-full mb-6 text-primary-600">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Quase lá!</h1>
      <p className="text-slate-500 mb-8 font-medium">
        Clique no botão abaixo para confirmar seu acesso e entrar no Revyza de forma segura.
      </p>
      <button
        onClick={handleConfirm}
        disabled={isPending}
        className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isPending ? 'Confirmando...' : 'Confirmar Acesso'}
      </button>
    </div>
  )
}

export default function ConfirmarPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-primary-50 text-slate-900 p-4">
      <div className="w-full max-w-[420px] bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 animate-page">
        <div className="flex items-center justify-center mb-8">
          <Image 
            src="/logo.png" 
            alt="Revyza Logo" 
            width={180} 
            height={60} 
            className="object-contain"
            priority
          />
        </div>
        
        <Suspense fallback={<div className="text-center text-sm text-slate-500 font-medium">Carregando validação...</div>}>
          <ConfirmarContent />
        </Suspense>
      </div>
    </main>
  )
}