'use client'

import { useState, useTransition, useRef, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { loginAction, signupAction, resetPasswordAction, joinWaitlistAction } from './actions'
import { useToast } from '@/components/ToastContext'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginContent() {
  const searchParams = useSearchParams()
  const [isLogin, setIsLogin] = useState(true)
  const [isWaitlistMode, setIsWaitlistMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (searchParams.get('tab') === 'cadastrar') setIsLogin(false)
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      if (isWaitlistMode) {
        const res = await joinWaitlistAction(formData)
        if (res?.error) toast(res.error, 'error')
        else if (res?.success) {
          toast(res.success, 'success')
          if (formRef.current) formRef.current.reset()
        }
        return
      }

      if (isLogin) {
        const res = await loginAction(formData)
        if (res?.error) toast(res.error, 'error')
      } else {
        const res = await signupAction(formData)
        if (res?.isWaitlist) {
          toast('As 30 vagas da fase Beta esgotaram! Mas você pode entrar na lista de espera.', 'error')
          setIsWaitlistMode(true)
        } else if (res?.error) {
          toast(res.error, 'error')
        }
      }
    })
  }

  const handleForgotPassword = () => {
    if (!formRef.current) return
    const formData = new FormData(formRef.current)
    const email = formData.get('email') as string

    if (!email) return toast('Preencha o campo de e-mail acima para recuperar sua senha.', 'error')

    startTransition(async () => {
      const res = await resetPasswordAction(email)
      if (res?.error) toast(res.error, 'error')
      else if (res?.success) toast(res.success, 'success')
    })
  }

  const handleForgotEmail = () => toast('Como o e-mail é a sua chave primária, caso o tenha perdido, chame nosso suporte.', 'error')

  const inputClass = "w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 placeholder:text-slate-400 bg-white transition-all text-sm font-medium"

  return (
    <div className="w-full max-w-[420px] bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 animate-page">
      <div className="flex items-center justify-center mb-5">
        <Image src="/logo.png" alt="Logo" width={140} height={45} className="object-contain" priority />
      </div>

      {!isWaitlistMode ? (
        <div className="flex bg-primary-50 p-1 rounded-full mb-8">
          <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${isLogin ? 'bg-primary-200 text-primary-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Entrar</button>
          <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${!isLogin ? 'bg-primary-200 text-primary-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Cadastrar</button>
        </div>
      ) : (
        <div className="text-center mb-8 bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <div className="flex justify-center mb-2"><Lock className="w-6 h-6 text-amber-500" /></div>
          <h2 className="text-lg font-bold text-amber-900 mb-1">Fase Beta Lotada</h2>
          <p className="text-xs text-amber-700 font-medium">As 30 primeiras vagas foram preenchidas. Coloque seus dados abaixo para ser o primeiro a saber quando abrirmos novamente.</p>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        {(!isLogin || isWaitlistMode) && (
          <input type="text" name="fullName" placeholder="Nome completo" required className={inputClass} />
        )}

        <input type="email" name="email" placeholder="E-mail" required className={inputClass} />

        {(!isWaitlistMode) && (
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Senha" required className={inputClass} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        )}

        {!isLogin && !isWaitlistMode && (
          <div className="relative">
            <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirmar senha" required className={inputClass} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        )}

        {isLogin && !isWaitlistMode && (
          <div className="flex justify-between items-center px-1 mt-1 mb-2">
            <button type="button" onClick={handleForgotEmail} className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2">Esqueci meu e-mail</button>
            <button type="button" onClick={handleForgotPassword} disabled={isPending} className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2 disabled:opacity-50">Esqueci minha senha</button>
          </div>
        )}

        <button type="submit" disabled={isPending} className={`w-full py-3.5 mt-2 text-white font-bold rounded-xl transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed ${isWaitlistMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
          {isPending ? 'Aguarde...' : isWaitlistMode ? 'Entrar na Lista de Espera' : isLogin ? 'Entrar' : 'Cadastrar'}
        </button>

        {isWaitlistMode && (
          <button type="button" onClick={() => setIsWaitlistMode(false)} className="text-sm font-bold text-slate-500 hover:text-slate-700 transition mt-2">
            Voltar para o login
          </button>
        )}

        {!isLogin && !isWaitlistMode && (
          <p className="text-center text-xs text-slate-500 mt-2 px-2 leading-relaxed">
            Ao se cadastrar, você concorda com nossos{' '}
            <Link href="/termos" target="_blank" className="text-primary-600 font-semibold hover:underline">Termos de Uso</Link> e{' '}
            <Link href="/privacidade" target="_blank" className="text-primary-600 font-semibold hover:underline">Política de Privacidade</Link>.
          </p>
        )}
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-primary-50 text-slate-900 p-4">
      <Suspense fallback={<div className="w-full max-w-[420px] bg-white p-8 md:p-10 rounded-3xl shadow-xl flex justify-center items-center h-64"><p className="text-slate-500 font-medium">Carregando...</p></div>}>
        <LoginContent />
      </Suspense>
    </main>
  )
}