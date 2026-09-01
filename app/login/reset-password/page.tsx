'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { updatePasswordAction } from './actions'
import { useToast } from '@/components/ToastContext'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updatePasswordAction(formData)
      if (res?.error) {
        toast(res.error, 'error')
      }
    })
  }

  const inputClass = "w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 placeholder:text-slate-400 bg-white transition-all text-sm font-medium"

  return (
    <main className="min-h-screen flex items-center justify-center bg-primary-50 text-slate-900 p-4">
      <div className="w-full max-w-[420px] bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 animate-page">
        
        {/* LOGO */}
        <div className="flex items-center justify-center mb-6">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={180} 
            height={60} 
            className="object-contain"
            priority
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Redefinir Senha</h1>
          <p className="text-sm text-slate-500 font-medium">Insira sua nova senha de acesso abaixo.</p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Nova senha"
              required
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirmar nova senha"
              required
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Voltar para o login
          </Link>
        </div>

      </div>
    </main>
  )
}