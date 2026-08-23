'use client'

import { useState } from 'react'
import { Folder, BookOpen, PieChart, Plus, Clock, Check, Pencil, Trash2, X } from 'lucide-react'
import { 
  createTopico, 
  createAssunto, 
  updateAssunto, 
  deleteAssunto, 
  toggleAssunto 
} from '@/app/dashboard/materias/[materia]/actions'

interface Materia {
  id: string
  name: string
}

interface Topico {
  id: string
  name: string
}

interface Assunto {
  id: string
  topico_id: string
  name: string
  duration_minutes: number
  is_done: boolean
}

export default function TopicsManager({
  materia,
  initialTopicos,
  initialAssuntos
}: {
  materia: Materia
  initialTopicos: Topico[]
  initialAssuntos: Assunto[]
}) {
  const [topicos, setTopicos] = useState<Topico[]>(initialTopicos)
  const [assuntos, setAssuntos] = useState<Assunto[]>(initialAssuntos)

  // Estados de Criação de Tópico
  const [isTopicoModalOpen, setIsTopicoModalOpen] = useState(false)
  const [newTopicoName, setNewTopicoName] = useState('')

  // Estados de Criação de Assunto
  const [activeTopicoId, setActiveTopicoId] = useState<string | null>(null)
  const [newAssuntoName, setNewAssuntoName] = useState('')

  // Estados de Edição de Assunto
  const [editingAssunto, setEditingAssunto] = useState<Assunto | null>(null)
  const [editAssuntoName, setEditAssuntoName] = useState('')

  // --- Lógica de Estatísticas ---
  const totalAssuntos = assuntos.length
  const assuntosConcluidos = assuntos.filter(a => a.is_done).length
  const progresso = totalAssuntos === 0 ? 0 : Math.round((assuntosConcluidos / totalAssuntos) * 100)

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${String(mins).padStart(2, '0')}min`
  }

  // --- Handlers ---
  const handleCreateTopico = async () => {
    if (!newTopicoName.trim()) return
    const result = await createTopico(materia.id, newTopicoName)
    if (result.topico) {
      setTopicos([...topicos, result.topico])
      setIsTopicoModalOpen(false)
      setNewTopicoName('')
    }
  }

  const handleCreateAssunto = async () => {
    if (!newAssuntoName.trim() || !activeTopicoId) return
    const result = await createAssunto(activeTopicoId, newAssuntoName)
    if (result.assunto) {
      setAssuntos([...assuntos, result.assunto])
      setActiveTopicoId(null)
      setNewAssuntoName('')
    }
  }

  const handleToggleAssunto = async (assuntoId: string, currentStatus: boolean) => {
    // Optimistic UI update
    setAssuntos(assuntos.map(a => a.id === assuntoId ? { ...a, is_done: !currentStatus } : a))
    const result = await toggleAssunto(assuntoId, !currentStatus)
    if (result.error) {
      // Revert if error
      setAssuntos(assuntos.map(a => a.id === assuntoId ? { ...a, is_done: currentStatus } : a))
    }
  }

  const handleEditAssunto = async () => {
    if (!editingAssunto || !editAssuntoName.trim()) return
    const result = await updateAssunto(editingAssunto.id, editAssuntoName)
    if (result.assunto) {
      setAssuntos(assuntos.map(a => a.id === editingAssunto.id ? { ...a, name: editAssuntoName } : a))
      setEditingAssunto(null)
    }
  }

  const handleDeleteAssunto = async (assuntoId: string) => {
    if (confirm("Tem certeza que deseja excluir este assunto?")) {
      const result = await deleteAssunto(assuntoId)
      if (result.success) {
        setAssuntos(assuntos.filter(a => a.id !== assuntoId))
        if (editingAssunto?.id === assuntoId) setEditingAssunto(null)
      }
    }
  }

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Assuntos e temas</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Gerencie e organize os conteúdos para estudar em {materia.name}</p>
        </div>
        <button 
          onClick={() => setIsTopicoModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition shadow-sm"
        >
          <Plus className="w-4.5 h-4.5" />
          Criar tópico
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-fuchsia-50 p-3 rounded-xl text-fuchsia-600">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total de tópicos</p>
            <p className="text-xl font-bold text-slate-900">{topicos.length} Tópicos</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="bg-fuchsia-50 p-3 rounded-xl text-fuchsia-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total de assuntos</p>
            <p className="text-xl font-bold text-slate-900">{totalAssuntos} Assuntos</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-purple-600">
              <PieChart className="w-5 h-5" />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <p className="text-xs text-slate-500 font-medium">Média de progresso</p>
              <p className="text-sm font-bold text-slate-900">{progresso}%</p>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progresso}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Lista de Tópicos e Assuntos */}
      <div className="space-y-6">
        {topicos.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed border-slate-300 rounded-2xl">
            <p className="text-slate-500">Nenhum tópico criado. Clique em "Criar tópico" para começar.</p>
          </div>
        ) : (
          topicos.map(topico => {
            const assuntosDoTopico = assuntos.filter(a => a.topico_id === topico.id)
            return (
              <div key={topico.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                
                {/* Cabeçalho do Tópico */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-1 bg-purple-600 rounded-full"></div>
                    <h2 className="text-lg font-bold text-slate-900">{topico.name}</h2>
                    <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-md">
                      {assuntosDoTopico.length} assuntos
                    </span>
                  </div>
                  <button 
                    onClick={() => setActiveTopicoId(topico.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Criar assunto
                  </button>
                </div>

                {/* Linhas de Assuntos */}
                <div className="flex flex-col">
                  {assuntosDoTopico.length === 0 ? (
                    <div className="p-5 text-sm text-slate-400 italic">Nenhum assunto cadastrado neste tópico.</div>
                  ) : (
                    assuntosDoTopico.map((assunto, index) => (
                      <div 
                        key={assunto.id} 
                        className={`flex items-center justify-between p-4 px-6 hover:bg-slate-50 transition ${index !== assuntosDoTopico.length - 1 ? 'border-b border-slate-100' : ''}`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <button
                            onClick={() => handleToggleAssunto(assunto.id, assunto.is_done)}
                            className={`w-5 h-5 border-2 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                              assunto.is_done 
                                ? 'bg-purple-600 border-purple-600' 
                                : 'border-slate-300 hover:border-purple-400'
                            }`}
                          >
                            {assunto.is_done && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                          </button>
                          <span className={`text-sm font-medium ${assunto.is_done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {assunto.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium">{formatDuration(assunto.duration_minutes)}</span>
                          </div>
                          <button 
                            onClick={() => {
                              setEditingAssunto(assunto)
                              setEditAssuntoName(assunto.name)
                            }}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
                            title="Editar assunto"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal: Criar Tópico */}
      {isTopicoModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Novo Tópico</h3>
              <button onClick={() => setIsTopicoModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <input
              type="text"
              value={newTopicoName}
              onChange={(e) => setNewTopicoName(e.target.value)}
              placeholder="Ex: Matemática Básica"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              autoFocus
            />
            <button
              onClick={handleCreateTopico}
              disabled={!newTopicoName.trim()}
              className="w-full py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
            >
              Criar Tópico
            </button>
          </div>
        </div>
      )}

      {/* Modal: Criar Assunto */}
      {activeTopicoId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Novo Assunto</h3>
              <button onClick={() => setActiveTopicoId(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <input
              type="text"
              value={newAssuntoName}
              onChange={(e) => setNewAssuntoName(e.target.value)}
              placeholder="Ex: Frações e decimais"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              autoFocus
            />
            <button
              onClick={handleCreateAssunto}
              disabled={!newAssuntoName.trim()}
              className="w-full py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
            >
              Criar Assunto
            </button>
          </div>
        </div>
      )}

      {/* Modal: Editar Assunto */}
      {editingAssunto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Editar Assunto</h3>
              <button onClick={() => setEditingAssunto(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <input
              type="text"
              value={editAssuntoName}
              onChange={(e) => setEditAssuntoName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteAssunto(editingAssunto.id)}
                className="flex items-center justify-center p-2.5 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                title="Excluir"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleEditAssunto}
                disabled={!editAssuntoName.trim() || editAssuntoName === editingAssunto.name}
                className="flex-1 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}