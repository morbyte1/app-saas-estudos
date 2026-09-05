'use client'

import { useState, useEffect, useTransition } from 'react'
import { useToast } from '@/components/ToastContext'
import { createClient } from '@/utils/supabase/client'
import { User, Mail, Lock, LogOut, Loader2, AlertTriangle, X, Target } from 'lucide-react'
import { updateUserProfile, updateUserEmail, updateUserPassword, deleteAccount, updateExamPreference } from './actions'
import { signout } from '../actions'
import ConfirmModal from '@/components/ConfirmModal'


export default function ConfiguracoesPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [examPreference, setExamPreference] = useState<'ENEM' | 'OUTRO'>('OUTRO')
  
useEffect(() => {
    async function loadUserData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setFullName(user.user_metadata?.full_name || '')
        setEmail(user.email || '')
        
        // Puxa a preferência da meta
        const { data: examGoals } = await supabase.from('exam_goals').select('name').eq('user_id', user.id)
        if (examGoals && examGoals.length > 0 && examGoals[0].name === 'ENEM 2026') {
            setExamPreference('ENEM')
        } else {
            setExamPreference('OUTRO')
        }
      }
      setIsLoadingData(false)
    }
    loadUserData()
  }, [])

  const handleUpdateExamPreference = () => {
    startTransition(async () => {
      const res = await updateExamPreference(examPreference)
      if (res.error) toast(res.error, 'error')
      else toast('Preferência de prova atualizada com sucesso!', 'success')
    })
  }

  // Estados para exclusão de conta
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  
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

  const handleDeleteAccount = () => {
    if (!deletePassword) return toast('Digite sua senha para confirmar.', 'error')
    setIsDeleting(true)
    startTransition(async () => {
      const res = await deleteAccount(deletePassword)
      if (res.error) {
        toast(res.error, 'error')
        setIsDeleting(false)
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
                disabled={isPending || isDeleting}
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
                  disabled={isPending || isDeleting}
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
                  disabled={isPending || !password || isDeleting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50 whitespace-nowrap"
                >
                  Atualizar Senha
                </button>
              </div>
            </div>
          </section>

{/* Sessão: Prova Foco */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary-50 p-2 rounded-lg text-primary-600">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Prova Foco</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-2">Qual prova você vai fazer?</label>
                <select
                  value={examPreference}
                  onChange={(e) => setExamPreference(e.target.value as 'ENEM' | 'OUTRO')}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 bg-white"
                >
                  <option value="ENEM">ENEM</option>
                  <option value="OUTRO">Nenhuma prova (Focar apenas em estudar)</option>
                </select>
              </div>
              <button
                onClick={handleUpdateExamPreference}
                disabled={isPending || isDeleting}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50 whitespace-nowrap"
              >
                Salvar Preferência
              </button>
            </div>
          </section>

          {/* Sessão: Perigo (Sair e Excluir) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
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
  onClick={() => setIsLogoutModalOpen(true)}
  disabled={isPending || isDeleting}
  className="w-full mt-2 px-6 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition disabled:opacity-50 whitespace-nowrap"
>
  Sair da conta
</button>
            </section>

            <section className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm flex flex-col justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-50 p-2 rounded-lg text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Zona de Perigo</h2>
                  <p className="text-xs text-slate-500 font-medium">Esta ação não poderá ser desfeita.</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isPending || isDeleting}
                className="w-full mt-2 px-6 py-2.5 border border-red-200 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition disabled:opacity-50 whitespace-nowrap"
              >
                Excluir minha conta
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* Modal de Exclusão de Conta */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-modal">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Confirmar Exclusão
              </h3>
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setDeletePassword('') }} 
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Tem certeza que deseja excluir sua conta? Todo o seu progresso, matérias, tarefas e histórico no timer serão <strong className="text-slate-900">apagados permanentemente</strong>.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Digite sua senha para confirmar</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                  placeholder="Sua senha atual"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setDeletePassword('') }}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, excluir conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    <ConfirmModal
  isOpen={isLogoutModalOpen}
  title="Sair da conta"
  message="Tem certeza que deseja encerrar sua sessão neste dispositivo?"
  confirmText="Sim, sair"
  isDanger={false}
  onConfirm={() => startTransition(async () => await signout())}
  onCancel={() => setIsLogoutModalOpen(false)}
  isLoading={isPending}
/>
    </div>
  )
}