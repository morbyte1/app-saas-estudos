'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, BookOpen } from 'lucide-react'
import { loginAction, signupAction } from './actions'
import { useToast } from '@/components/ToastContext'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      if (isLogin) {
        const res = await loginAction(formData)
        if (res?.error) toast(res.error, 'error')
      } else {
        const res = await signupAction(formData)
        if (res?.error) toast(res.error, 'error')
      }
    })
  }

  const inputClass = "w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 placeholder:text-slate-400 bg-white transition-all text-sm font-medium"

  return (
    <main className="min-h-screen flex items-center justify-center bg-primary-50 text-slate-900 p-4">
      <div className="w-full max-w-[420px] bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 animate-page">
        
        {/* LOGO */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-primary-600 text-white p-1.5 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
            studia<span className="text-secondary-500">.</span>
          </span>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-primary-50 p-1 rounded-full mb-8">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${
              isLogin ? 'bg-primary-200 text-primary-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${
              !isLogin ? 'bg-primary-200 text-primary-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {!isLogin && (
            <input
              type="text"
              name="fullName"
              placeholder="Nome completo"
              required={!isLogin}
              className={inputClass}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="E-mail"
            required
            className={inputClass}
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Senha"
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

          {!isLogin && (
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirmar senha"
                required={!isLogin}
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
          )}

          {isLogin && (
            <div className="flex justify-between items-center px-1 mt-1 mb-2">
              <a href="#" className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors">
                Esqueci meu e-mail
              </a>
              <a href="#" className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors">
                Esqueci minha senha
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 mt-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

      </div>
    </main>
  )
}