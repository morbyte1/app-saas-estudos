'use client'

import { useState, useEffect, useTransition } from 'react'
import { useToast } from '@/components/ToastContext'
import { createClient } from '@/utils/supabase/client'
import { User, Mail, Lock, LogOut, Loader2 } from 'lucide-react'
import { updateUserProfile, updateUserEmail, updateUserPassword } from './actions'
import { signout } from '../actions'

export default function ConfiguracoesPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isPending, startTransition] = useTransition()
  
  const { toast } = useToast()

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setFullName(user.user_metadata?.full_name || '')
        setEmail(user.email || '')
      }
      setIsLoadingData(false)
    }
    loadUserData()
  }, [])

  const handleUpdateName = () => {
    if (!fullName.trim()) return toast('O nome não pode estar vazio.', 'error')
    startTransition(async () => {
      const res = await updateUserProfile(fullName)
      if (res.error) toast(`Erro ao atualizar nome: ${res.error}`, 'error')
      else toast('Nome atualizado com sucesso!', 'success')
    })
  }

  const handleUpdateEmail = () => {
    if (!email.trim() || !email.includes('@')) return toast('Insira um e-mail válido.', 'error')
    startTransition(async () => {
      const res = await updateUserEmail(email)
      if (res.error) {
        toast(`Erro ao atualizar e-mail: ${res.error}`, 'error')
      } else {
        toast('Solicitação enviada! Verifique as caixas de entrada do seu e-mail antigo e do novo para confirmar a alteração.', 'success')
      }
    })
  }

  const handleUpdatePassword = () => {
    if (password.length < 6) return toast('A nova senha deve ter no mínimo 6 caracteres.', 'error')
    startTransition(async () => {
      const res = await updateUserPassword(password)
      if (res.error) toast(`Erro ao atualizar senha: ${res.error}`, 'error')
      else {
        toast('Senha atualizada com sucesso!', 'success')
        setPassword('')
      }
    })
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Configurações</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Gerencie as informações da sua conta e preferências</p>
        </div>

        <div className="space-y-6">
          {/* Sessão: Perfil */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary-50 p-2 rounded-lg text-primary-600">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Perfil</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                />
              </div>
              <button
                onClick={handleUpdateName}
                disabled={isPending}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50 whitespace-nowrap"
              >
                Atualizar Nome
              </button>
            </div>
          </section>

          {/* Sessão: Conta / Acesso */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary-50 p-2 rounded-lg text-primary-600">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Acesso</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900"
                  />
                </div>
                <button
                  onClick={handleUpdateEmail}
                  disabled={isPending}
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50 whitespace-nowrap"
                >
                  Atualizar E-mail
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nova Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Deixe em branco para não alterar"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <button
                  onClick={handleUpdatePassword}
                  disabled={isPending || !password}
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50 whitespace-nowrap"
                >
                  Atualizar Senha
                </button>
              </div>
            </div>
          </section>

          {/* Sessão: Perigo (Sair da conta) */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-lg text-red-600">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Sessão</h2>
                <p className="text-xs text-slate-500 font-medium">Encerrar sua sessão neste dispositivo.</p>
              </div>
            </div>
            
            <button
              onClick={() => startTransition(async () => await signout())}
              disabled={isPending}
              className="px-6 py-2.5 border border-red-200 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition disabled:opacity-50 whitespace-nowrap"
            >
              Sair da conta
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}