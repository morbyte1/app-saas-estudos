'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { 
  ChevronLeft, PlayCircle, Clock, Target, Calendar, 
  Check, Plus, Trash2, Pencil, Activity, X, BookOpen, AlertTriangle
} from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/ToastContext'
import { 
  createTopico, updateTopico, deleteTopico, 
  createAssunto, updateAssunto, deleteAssunto, toggleAssunto 
} from '@/app/dashboard/materias/[id]/actions'

type Materia = any
type Topico = any
type Assunto = any
type StudySession = any

interface MateriaViewProps {
  materia: Materia
  initialTopicos: Topico[]
  initialAssuntos: Assunto[]
  sessions: StudySession[]
}

export default function MateriaView({ materia, initialTopicos, initialAssuntos, sessions }: MateriaViewProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  // Estados para Tópicos
  const [topicos, setTopicos] = useState<Topico[]>(initialTopicos)
  const [isTopicoModalOpen, setIsTopicoModalOpen] = useState(false)
  const [newTopicoName, setNewTopicoName] = useState('')
  const [editingTopico, setEditingTopico] = useState<Topico | null>(null)
  const [editTopicoName, setEditTopicoName] = useState('')
  const [topicoToDelete, setTopicoToDelete] = useState<string | null>(null)

  // Estados para Assuntos
  const [assuntos, setAssuntos] = useState<Assunto[]>(initialAssuntos)
  const [activeTopicoId, setActiveTopicoId] = useState<string | null>(null)
  const [newAssuntoName, setNewAssuntoName] = useState('')
  const [editingAssunto, setEditingAssunto] = useState<Assunto | null>(null)
  const [editAssuntoName, setEditAssuntoName] = useState('')
  const [assuntoToDelete, setAssuntoToDelete] = useState<string | null>(null)
  
  const [isDeletingItems, setIsDeletingItems] = useState(false)

  // Cálculos de Visão Geral
  const now = new Date()
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
  
  const weekSessions = sessions.filter(s => new Date(s.created_at) >= startOfWeek)
  const weekSeconds = weekSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
  const weekHours = Math.floor(weekSeconds / 3600)
  const weekMinutes = Math.floor((weekSeconds % 3600) / 60)
  
  const totalQuestions = sessions.reduce((acc, s) => acc + (s.questions_answered || 0), 0)
  const totalErrors = sessions.reduce((acc, s) => acc + (s.errors || 0), 0)
  const accuracy = totalQuestions > 0 ? Math.round(((totalQuestions - totalErrors) / totalQuestions) * 100) : null

  const lastSession = sessions.length > 0 ? new Date(sessions[0].created_at) : null
  const progressoConteudo = assuntos.length === 0 ? 0 : Math.round((assuntos.filter(a => a.is_done).length / assuntos.length) * 100)

  // Handlers Tópicos
  const handleCreateTopico = async () => {
    if (!newTopicoName.trim()) return toast('Insira o nome do tópico.', 'error')
    startTransition(async () => {
      const result = await createTopico(materia.id, newTopicoName)
      if (result.topico) {
        setTopicos([...topicos, result.topico])
        setIsTopicoModalOpen(false)
        setNewTopicoName('')
        toast('Tópico criado com sucesso!', 'success')
      } else toast('Erro ao criar tópico.', 'error')
    })
  }

  const handleEditTopico = async () => {
    if (!editingTopico || !editTopicoName.trim()) return toast('Insira um nome válido.', 'error')
    startTransition(async () => {
      const result = await updateTopico(editingTopico.id, editTopicoName)
      if (result.topico) {
        setTopicos(topicos.map(t => t.id === editingTopico.id ? { ...t, name: editTopicoName } : t))
        setEditingTopico(null)
        toast('Tópico atualizado!', 'success')
      } else toast('Erro ao atualizar tópico.', 'error')
    })
  }

  const executeDeleteTopico = async () => {
    if (!topicoToDelete) return
    setIsDeletingItems(true)
    const result = await deleteTopico(topicoToDelete)
    if (result.success) {
      setTopicos(topicos.filter(t => t.id !== topicoToDelete))
      setAssuntos(assuntos.filter(a => a.topico_id !== topicoToDelete))
      if (editingTopico?.id === topicoToDelete) setEditingTopico(null)
      toast('Tópico excluído!', 'success')
    } else toast('Erro ao excluir tópico.', 'error')
    setIsDeletingItems(false)
    setTopicoToDelete(null)
  }

  // Handlers Assuntos
  const handleCreateAssunto = async () => {
    if (!newAssuntoName.trim() || !activeTopicoId) return toast('Insira o nome do assunto.', 'error')
    startTransition(async () => {
      const result = await createAssunto(activeTopicoId, newAssuntoName)
      if (result.assunto) {
        setAssuntos([...assuntos, result.assunto])
        setActiveTopicoId(null)
        setNewAssuntoName('')
        toast('Assunto adicionado!', 'success')
      } else toast('Erro ao adicionar assunto.', 'error')
    })
  }

  const handleEditAssunto = async () => {
    if (!editingAssunto || !editAssuntoName.trim()) return toast('Insira um nome válido.', 'error')
    startTransition(async () => {
      const result = await updateAssunto(editingAssunto.id, editAssuntoName)
      if (result.assunto) {
        setAssuntos(assuntos.map(a => a.id === editingAssunto.id ? { ...a, name: editAssuntoName } : a))
        setEditingAssunto(null)
        toast('Assunto atualizado!', 'success')
      } else toast('Erro ao atualizar assunto.', 'error')
    })
  }

  const executeDeleteAssunto = async () => {
    if (!assuntoToDelete) return
    setIsDeletingItems(true)
    const result = await deleteAssunto(assuntoToDelete)
    if (result.success) {
      setAssuntos(assuntos.filter(a => a.id !== assuntoToDelete))
      if (editingAssunto?.id === assuntoToDelete) setEditingAssunto(null)
      toast('Assunto excluído.', 'success')
    } else toast('Erro ao excluir assunto.', 'error')
    setIsDeletingItems(false)
    setAssuntoToDelete(null)
  }

  const handleToggleAssunto = async (assuntoId: string, currentStatus: boolean) => {
    setAssuntos(assuntos.map(a => a.id === assuntoId ? { ...a, is_done: !currentStatus } : a))
    startTransition(async () => {
      const result = await toggleAssunto(assuntoId, !currentStatus)
      if (result.error) {
        setAssuntos(assuntos.map(a => a.id === assuntoId ? { ...a, is_done: currentStatus } : a))
        toast('Erro ao alterar o status.', 'error')
      }
    })
  }

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}min`
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <Link href="/dashboard/materias" className="flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 w-fit transition-colors mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para Minhas Matérias
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{materia.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {materia.weekly_goal && (
              <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md flex items-center gap-1.5">
                <Target className="w-4 h-4 text-slate-400" /> Meta semanal: {materia.weekly_goal}h
              </span>
            )}
            <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
              {progressoConteudo}% do conteúdo concluído
            </span>
          </div>
        </div>
        <div className="flex w-full md:w-auto">
          <Link 
            href={`/dashboard/timer?materiaId=${materia.id}`} 
            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-sm"
          >
            <PlayCircle className="w-5 h-5" /> Estudar Agora
          </Link>
        </div>
      </header>

      {/* Visão Geral Compacta */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Estudado na semana</span>
          <span className="text-2xl font-extrabold text-slate-900">
            {weekHours > 0 ? `${weekHours}h ${weekMinutes}m` : `${weekMinutes}m`}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity className="w-4 h-4" /> Precisão Histórica</span>
          {accuracy !== null ? (
            <span className="text-2xl font-extrabold text-slate-900">{accuracy}%</span>
          ) : (
            <span className="text-sm text-slate-400 font-medium">Sem questões respondidas</span>
          )}
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Conteúdo</span>
          <span className="text-2xl font-extrabold text-slate-900">{topicos.length} <span className="text-sm font-semibold text-slate-400">tópicos</span></span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Último estudo</span>
          <span className="text-lg font-extrabold text-slate-900">
            {lastSession ? lastSession.toLocaleDateString('pt-BR') : 'Ainda não estudado'}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Coluna Principal: Conteúdo (Tópicos e Assuntos) */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Conteúdo Programático</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Estruture os tópicos e marque o que já estudou.</p>
            </div>
            <button 
              onClick={() => setIsTopicoModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-50 text-primary-700 font-bold rounded-xl hover:bg-primary-100 transition shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" /> Novo Tópico
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            {topicos.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Matéria Vazia</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Crie seu primeiro tópico para começar a organizar a estrutura de estudos.</p>
                <button 
                  onClick={() => setIsTopicoModalOpen(true)}
                  className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition shadow-sm"
                >
                  Adicionar Tópico
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {topicos.map(topico => {
                  const topicoAssuntos = assuntos.filter(a => a.topico_id === topico.id)
                  
                  return (
                    <div key={topico.id} className="relative group/topico">
                      {/* Linha do Tópico */}
                      <div className="flex items-end justify-between border-b-2 border-slate-100 pb-2 mb-3">
                        <h2 className="text-xl font-extrabold text-slate-900 group-hover/topico:text-primary-700 transition-colors">
                          {topico.name}
                        </h2>
                        <div className="flex items-center gap-1 opacity-0 group-hover/topico:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingTopico(topico); setEditTopicoName(topico.name) }} className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg bg-slate-50 hover:bg-primary-50 transition" title="Editar tópico"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setActiveTopicoId(topico.id)} className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg bg-slate-50 hover:bg-primary-50 transition" title="Novo assunto"><Plus className="w-5 h-5" /></button>
                        </div>
                      </div>

                      {/* Lista de Assuntos */}
                      <div className="flex flex-col gap-1 pl-2 md:pl-4">
                        {topicoAssuntos.length === 0 ? (
                          <div className="py-3 flex items-center justify-between text-sm text-slate-400 font-medium bg-slate-50/50 rounded-xl px-4 border border-slate-100 border-dashed">
                            Sem conteúdos cadastrados.
                            <button onClick={() => setActiveTopicoId(topico.id)} className="text-primary-600 font-semibold hover:underline">Adicionar</button>
                          </div>
                        ) : (
                          topicoAssuntos.map(assunto => (
                            <div key={assunto.id} className="group/assunto flex items-center justify-between py-2 px-3 hover:bg-slate-50 hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-100">
                              <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleToggleAssunto(assunto.id, assunto.is_done)}>
                                <div className={`w-5 h-5 border-[2px] rounded flex items-center justify-center flex-shrink-0 transition-all ${assunto.is_done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover/assunto:border-primary-400 bg-white'}`}>
                                  {assunto.is_done && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </div>
                                <span className={`text-sm font-semibold transition-colors ${assunto.is_done ? 'text-slate-400 line-through' : 'text-slate-700 group-hover/assunto:text-slate-900'}`}>
                                  {assunto.name}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                {assunto.duration_minutes > 0 && (
                                  <div className="flex items-center gap-1.5 text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">{formatTime(assunto.duration_minutes * 60)}</span>
                                  </div>
                                )}
                                <div className="flex gap-1 opacity-0 group-hover/assunto:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingAssunto(assunto); setEditAssuntoName(assunto.name) }} className="p-1.5 text-slate-400 hover:text-primary-600 bg-slate-100 hover:bg-primary-50 rounded-lg transition" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Coluna Lateral: Histórico Recente */}
        <aside className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Sessões Recentes</h2>
            
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-500 max-w-[180px]">Nenhuma sessão registrada. Comece a estudar para gerar histórico.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sessions.slice(0, 5).map(session => {
                  const assuntoRelacionado = assuntos.find(a => a.id === session.assunto_id)
                  const acertos = (session.questions_answered || 0) - (session.errors || 0)
                  
                  return (
                    <div key={session.id} className="border border-slate-100 rounded-2xl p-4 hover:border-primary-200 transition-colors bg-slate-50/50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {new Date(session.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-xs font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-md">
                          {formatTime(session.duration_seconds)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 line-clamp-1 mb-2">
                        {assuntoRelacionado?.name || 'Sessão geral'}
                      </p>
                      {session.questions_answered > 0 && (
                        <div className="flex items-center gap-3 text-xs font-semibold">
                          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100"><Check className="w-3 h-3" /> {acertos}</span>
                          <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100"><X className="w-3 h-3" /> {session.errors}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            
            {sessions.length > 5 && (
              <Link href="/dashboard/estatisticas" className="flex items-center justify-center w-full mt-6 py-2.5 text-sm text-primary-700 font-bold bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors">
                Ver estatísticas completas
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* Modais Customizados React */}

      {/* Modal Criar Tópico */}
      {isTopicoModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay" onClick={() => setIsTopicoModalOpen(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Novo Tópico</h3>
              <button onClick={() => setIsTopicoModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome do tópico</label>
            <input 
              type="text" 
              value={newTopicoName} 
              onChange={e => setNewTopicoName(e.target.value)} 
              placeholder="Ex: Funções" 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 mb-6 font-medium text-slate-900 bg-white" 
              autoFocus 
              onKeyDown={e => e.key === 'Enter' && handleCreateTopico()}
            />
            <button onClick={handleCreateTopico} disabled={!newTopicoName.trim() || isPending} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">
              Criar Tópico
            </button>
          </div>
        </div>
      )}

      {/* Modal Editar Tópico */}
      {editingTopico && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay" onClick={() => setEditingTopico(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Editar Tópico</h3>
              <button onClick={() => setEditingTopico(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome do tópico</label>
            <input 
              type="text" 
              value={editTopicoName} 
              onChange={e => setEditTopicoName(e.target.value)} 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 mb-6 font-medium text-slate-900 bg-white" 
              autoFocus 
              onKeyDown={e => e.key === 'Enter' && handleEditTopico()}
            />
            <div className="flex gap-3">
              <button onClick={() => setTopicoToDelete(editingTopico.id)} className="flex items-center justify-center p-3 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition" title="Excluir"><Trash2 className="w-5 h-5" /></button>
              <button onClick={handleEditTopico} disabled={!editTopicoName.trim() || editTopicoName === editingTopico.name || isPending} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Assunto */}
      {activeTopicoId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay" onClick={() => setActiveTopicoId(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Novo Assunto</h3>
              <button onClick={() => setActiveTopicoId(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome do assunto</label>
            <input 
              type="text" 
              value={newAssuntoName} 
              onChange={e => setNewAssuntoName(e.target.value)} 
              placeholder="Ex: Função Afim" 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 mb-6 font-medium text-slate-900 bg-white" 
              autoFocus 
              onKeyDown={e => e.key === 'Enter' && handleCreateAssunto()}
            />
            <button onClick={handleCreateAssunto} disabled={!newAssuntoName.trim() || isPending} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">
              Adicionar Assunto
            </button>
          </div>
        </div>
      )}

      {/* Modal Editar Assunto */}
      {editingAssunto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay" onClick={() => setEditingAssunto(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Editar Assunto</h3>
              <button onClick={() => setEditingAssunto(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome do assunto</label>
            <input 
              type="text" 
              value={editAssuntoName} 
              onChange={e => setEditAssuntoName(e.target.value)} 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 mb-6 font-medium text-slate-900 bg-white" 
              autoFocus 
              onKeyDown={e => e.key === 'Enter' && handleEditAssunto()}
            />
            <div className="flex gap-3">
              <button onClick={() => setAssuntoToDelete(editingAssunto.id)} className="flex items-center justify-center p-3 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition" title="Excluir"><Trash2 className="w-5 h-5" /></button>
              <button onClick={handleEditAssunto} disabled={!editAssuntoName.trim() || editAssuntoName === editingAssunto.name || isPending} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Exclusão usando o componente padrão do sistema */}
      <ConfirmModal 
        isOpen={!!topicoToDelete} 
        title="Excluir Tópico" 
        message="Tem certeza que deseja excluir este tópico? Todos os assuntos dentro dele serão permanentemente perdidos." 
        onConfirm={executeDeleteTopico} 
        onCancel={() => setTopicoToDelete(null)} 
        isLoading={isDeletingItems} 
      />
      <ConfirmModal 
        isOpen={!!assuntoToDelete} 
        title="Excluir Assunto" 
        message="Deseja excluir este assunto de forma permanente?" 
        onConfirm={executeDeleteAssunto} 
        onCancel={() => setAssuntoToDelete(null)} 
        isLoading={isDeletingItems} 
      />
    </div>
  )
}