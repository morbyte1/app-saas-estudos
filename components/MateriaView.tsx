'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { 
  ChevronLeft, Play, Clock, Target, Calendar, 
  CheckCircle2, Circle, Plus, Trash2, Edit2, Activity
} from 'lucide-react'
import { 
  createTopico, updateTopico, deleteTopico, 
  createAssunto, updateAssunto, deleteAssunto, toggleAssunto 
} from '@/app/dashboard/materias/[id]/actions'

// Tipagens inferidas pelo contexto
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
  const [isPending, startTransition] = useTransition()
  
  // Estados para edição/criação inline
  const [addingTopico, setAddingTopico] = useState(false)
  const [newTopicoName, setNewTopicoName] = useState('')
  const [addingAssuntoFor, setAddingAssuntoFor] = useState<string | null>(null)
  const [newAssuntoName, setNewAssuntoName] = useState('')

  // Cálculos de Visão Geral (baseado estritamente nas sessões reais)
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

  // Handlers
  const handleAddTopico = async () => {
    if (!newTopicoName.trim()) return
    startTransition(async () => {
      await createTopico(materia.id, newTopicoName)
      setNewTopicoName('')
      setAddingTopico(false)
    })
  }

  const handleDeleteTopico = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tópico? Todos os assuntos dentro dele serão perdidos.')) {
      startTransition(async () => {
        await deleteTopico(id)
      })
    }
  }

  const handleEditTopico = async (id: string, currentName: string) => {
    const newName = prompt('Editar nome do tópico:', currentName)
    if (newName && newName.trim() !== currentName) {
      startTransition(async () => {
        await updateTopico(id, newName.trim())
      })
    }
  }

  const handleAddAssunto = async (topicoId: string) => {
    if (!newAssuntoName.trim()) return
    startTransition(async () => {
      await createAssunto(topicoId, newAssuntoName)
      setNewAssuntoName('')
      setAddingAssuntoFor(null)
    })
  }

  const handleDeleteAssunto = async (id: string) => {
    if (confirm('Excluir este assunto?')) {
      startTransition(async () => {
        await deleteAssunto(id)
      })
    }
  }

  const handleEditAssunto = async (id: string, currentName: string) => {
    const newName = prompt('Editar nome do assunto:', currentName)
    if (newName && newName.trim() !== currentName) {
      startTransition(async () => {
        await updateAssunto(id, newName.trim())
      })
    }
  }

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-4">
        <Link href="/dashboard/materias" className="flex items-center text-sm text-slate-500 hover:text-purple-600 w-fit transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para Minhas Matérias
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{materia.name}</h1>
            {materia.weekly_goal && (
              <p className="text-slate-500 mt-1 flex items-center gap-1.5">
                <Target className="w-4 h-4" /> Meta semanal: {materia.weekly_goal}h
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <Link 
              href={`/timer?materia_id=${materia.id}`} 
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700 font-medium flex items-center justify-center transition-colors"
            >
              <Play className="w-4 h-4 mr-2 fill-current" /> Estudar esta matéria
            </Link>
          </div>
        </div>
      </header>

      {/* Visão Geral Compacta */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-sm text-slate-500 flex items-center gap-1.5 mb-1"><Clock className="w-4 h-4" /> Estudado na semana</span>
          <span className="text-2xl font-semibold text-slate-900">
            {weekHours > 0 ? `${weekHours}h ${weekMinutes}m` : `${weekMinutes}m`}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-sm text-slate-500 flex items-center gap-1.5 mb-1"><Activity className="w-4 h-4" /> Precisão Histórica</span>
          {accuracy !== null ? (
            <span className="text-2xl font-semibold text-slate-900">{accuracy}%</span>
          ) : (
            <span className="text-sm text-slate-400 mt-1">Nenhuma questão respondida</span>
          )}
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-sm text-slate-500 flex items-center gap-1.5 mb-1"><Target className="w-4 h-4" /> Conteúdo</span>
          <span className="text-2xl font-semibold text-slate-900">{initialTopicos.length} <span className="text-base font-normal text-slate-500">tópicos</span></span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-sm text-slate-500 flex items-center gap-1.5 mb-1"><Calendar className="w-4 h-4" /> Último estudo</span>
          <span className="text-lg font-medium text-slate-900">
            {lastSession ? lastSession.toLocaleDateString('pt-BR') : 'Ainda não estudado'}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Coluna Principal: Conteúdo (Tópicos e Assuntos) */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Conteúdo Programático</h2>
            <button 
              onClick={() => setAddingTopico(true)}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Novo Tópico
            </button>
          </div>

          {initialTopicos.length === 0 && !addingTopico && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
              <p className="text-slate-500 mb-4">Esta matéria ainda não possui conteúdo estruturado.</p>
              <button 
                onClick={() => setAddingTopico(true)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                Adicionar primeiro tópico
              </button>
            </div>
          )}

          {addingTopico && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-3 items-center">
              <input 
                type="text"
                autoFocus
                value={newTopicoName}
                onChange={e => setNewTopicoName(e.target.value)}
                placeholder="Nome do tópico (ex: Funções)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                onKeyDown={e => e.key === 'Enter' && handleAddTopico()}
              />
              <button onClick={handleAddTopico} disabled={isPending} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                Salvar
              </button>
              <button onClick={() => setAddingTopico(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium">
                Cancelar
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {initialTopicos.map(topico => {
              const topicoAssuntos = initialAssuntos.filter(a => a.topico_id === topico.id)
              
              return (
                <div key={topico.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  {/* Cabeçalho do Tópico */}
                  <div className="bg-slate-50/50 p-4 border-b border-slate-200 flex justify-between items-center group">
                    <div>
                      <h3 className="font-semibold text-slate-800">{topico.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{topicoAssuntos.length} assuntos</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button onClick={() => handleEditTopico(topico.id, topico.name)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteTopico(topico.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {/* Lista de Assuntos */}
                  <div className="p-2">
                    {topicoAssuntos.length === 0 && addingAssuntoFor !== topico.id ? (
                      <div className="text-center py-4 text-slate-500 text-sm">
                        Nenhum assunto neste tópico.
                        <button onClick={() => setAddingAssuntoFor(topico.id)} className="text-purple-600 font-medium ml-1 hover:underline">Adicionar</button>
                      </div>
                    ) : (
                      <ul className="flex flex-col">
                        {topicoAssuntos.map(assunto => (
                          <li key={assunto.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => {
                                  startTransition(() => { toggleAssunto(assunto.id, !assunto.is_done) })
                                }}
                                disabled={isPending}
                                className="focus:outline-none"
                              >
                                {assunto.is_done ? (
                                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                                ) : (
                                  <Circle className="text-slate-300 w-5 h-5 hover:text-purple-400 transition-colors" />
                                )}
                              </button>
                              <span className={`text-sm ${assunto.is_done ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                                {assunto.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              {assunto.duration_minutes > 0 && (
                                <span className="flex items-center text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                  <Clock className="w-3 h-3 mr-1"/> {assunto.duration_minutes}m
                                </span>
                              )}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button onClick={() => handleEditAssunto(assunto.id, assunto.name)} className="p-1 text-slate-400 hover:text-slate-700 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteAssunto(assunto.id)} className="p-1 text-slate-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Formulário Inline de Assunto */}
                    {addingAssuntoFor === topico.id ? (
                      <div className="flex gap-2 p-2 mt-1">
                        <input 
                          type="text" autoFocus value={newAssuntoName}
                          onChange={e => setNewAssuntoName(e.target.value)}
                          placeholder="Nome do assunto"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-purple-600"
                          onKeyDown={e => e.key === 'Enter' && handleAddAssunto(topico.id)}
                        />
                        <button onClick={() => handleAddAssunto(topico.id)} disabled={isPending} className="px-3 py-1.5 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-900">Add</button>
                        <button onClick={() => setAddingAssuntoFor(null)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-md text-sm font-medium">X</button>
                      </div>
                    ) : (
                      topicoAssuntos.length > 0 && (
                        <button 
                          onClick={() => setAddingAssuntoFor(topico.id)}
                          className="w-full text-left px-3 py-2 mt-1 text-sm text-slate-500 hover:bg-slate-50 hover:text-purple-600 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar assunto
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Coluna Lateral: Histórico Recente */}
        <aside className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Sessões Recentes</h2>
            
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Nenhuma sessão registrada. Comece a estudar para gerar histórico.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {sessions.slice(0, 5).map(session => {
                  const assuntoRelacionado = initialAssuntos.find(a => a.id === session.assunto_id)
                  const acertos = (session.questions_answered || 0) - (session.errors || 0)
                  
                  return (
                    <div key={session.id} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-medium text-slate-500">
                          {new Date(session.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          {formatTime(session.duration_seconds)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">
                        {assuntoRelacionado?.name || 'Sessão geral'}
                      </p>
                      {session.questions_answered > 0 && (
                        <p className="text-xs text-slate-500 mt-1 flex gap-2">
                          <span className="text-green-600">{acertos} acertos</span>
                          <span className="text-red-500">{session.errors} erros</span>
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            
            {sessions.length > 5 && (
              <button className="w-full mt-4 py-2 text-sm text-purple-600 font-medium bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                Ver histórico completo
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}