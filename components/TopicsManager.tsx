'use client'

import ConfirmModal from '@/components/ConfirmModal'
import { useState } from 'react'
import { Plus, Clock, Check, Pencil, Trash2, X, PlayCircle, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ToastContext'
import { 
  createTopico, updateTopico, deleteTopico,
  createAssunto, updateAssunto, deleteAssunto, toggleAssunto 
} from '@/app/dashboard/materias/[id]/actions'

interface Materia { id: string, name: string }
interface Topico { id: string, name: string }
interface Assunto { id: string, topico_id: string, name: string, duration_minutes: number, is_done: boolean }

export default function TopicsManager({ materia, initialTopicos, initialAssuntos }: { materia: Materia, initialTopicos: Topico[], initialAssuntos: Assunto[] }) {
  const [topicos, setTopicos] = useState<Topico[]>(initialTopicos)
  const [assuntos, setAssuntos] = useState<Assunto[]>(initialAssuntos)
  const { toast } = useToast()

  const [topicoToDelete, setTopicoToDelete] = useState<string | null>(null)
  const [assuntoToDelete, setAssuntoToDelete] = useState<string | null>(null)
  const [isDeletingItems, setIsDeletingItems] = useState(false)
  const [isTopicoModalOpen, setIsTopicoModalOpen] = useState(false)
  const [newTopicoName, setNewTopicoName] = useState('')
  const [editingTopico, setEditingTopico] = useState<Topico | null>(null)
  const [editTopicoName, setEditTopicoName] = useState('')
  const [activeTopicoId, setActiveTopicoId] = useState<string | null>(null)
  const [newAssuntoName, setNewAssuntoName] = useState('')
  const [editingAssunto, setEditingAssunto] = useState<Assunto | null>(null)
  const [editAssuntoName, setEditAssuntoName] = useState('')

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${String(mins).padStart(2, '0')}min`
  }

  const handleCreateTopico = async () => {
    if (!newTopicoName.trim()) return toast('Insira o nome do tópico.', 'error')
    const result = await createTopico(materia.id, newTopicoName)
    if (result.topico) {
      setTopicos([...topicos, result.topico])
      setIsTopicoModalOpen(false); setNewTopicoName('')
      toast('Tópico criado com sucesso!', 'success')
    } else toast('Erro ao criar tópico.', 'error')
  }

  const handleEditTopico = async () => {
    if (!editingTopico || !editTopicoName.trim()) return toast('Insira um nome válido.', 'error')
    const result = await updateTopico(editingTopico.id, editTopicoName)
    if (result.topico) {
      setTopicos(topicos.map(t => t.id === editingTopico.id ? { ...t, name: editTopicoName } : t))
      setEditingTopico(null)
      toast('Tópico atualizado!', 'success')
    } else toast('Erro ao atualizar tópico.', 'error')
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
    setIsDeletingItems(false); setTopicoToDelete(null)
  }

  const handleCreateAssunto = async () => {
    if (!newAssuntoName.trim() || !activeTopicoId) return toast('Insira o nome do assunto.', 'error')
    const result = await createAssunto(activeTopicoId, newAssuntoName)
    if (result.assunto) {
      setAssuntos([...assuntos, result.assunto])
      setActiveTopicoId(null); setNewAssuntoName('')
      toast('Assunto adicionado!', 'success')
    } else toast('Erro ao adicionar assunto.', 'error')
  }

  const handleToggleAssunto = async (assuntoId: string, currentStatus: boolean) => {
    setAssuntos(assuntos.map(a => a.id === assuntoId ? { ...a, is_done: !currentStatus } : a))
    const result = await toggleAssunto(assuntoId, !currentStatus)
    if (result.error) {
      setAssuntos(assuntos.map(a => a.id === assuntoId ? { ...a, is_done: currentStatus } : a))
      toast('Erro ao alterar o status.', 'error')
    }
  }

  const handleEditAssunto = async () => {
    if (!editingAssunto || !editAssuntoName.trim()) return toast('Insira um nome válido.', 'error')
    const result = await updateAssunto(editingAssunto.id, editAssuntoName)
    if (result.assunto) {
      setAssuntos(assuntos.map(a => a.id === editingAssunto.id ? { ...a, name: editAssuntoName } : a))
      setEditingAssunto(null)
      toast('Assunto atualizado!', 'success')
    } else toast('Erro ao atualizar assunto.', 'error')
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
    setIsDeletingItems(false); setAssuntoToDelete(null)
  }

  const progresso = assuntos.length === 0 ? 0 : Math.round((assuntos.filter(a => a.is_done).length / assuntos.length) * 100)

  return (
    <>
      {/* Cabeçalho da Página de Conteúdo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{materia.name}</h1>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">{progresso}% concluído</span>
            <span className="text-sm font-medium text-slate-500">{topicos.length} tópicos organizados</span>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setIsTopicoModalOpen(true)} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm">
            <Plus className="w-4.5 h-4.5" /> Adicionar Tópico
          </button>
          <Link href={`/dashboard/timer?materiaId=${materia.id}`} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-sm">
            <PlayCircle className="w-5 h-5" /> Estudar Agora
          </Link>
        </div>
      </div>

      {/* Lista Estilo Caderno/Syllabus */}
      <div className="space-y-8">
        {topicos.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Caderno Vazio</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Crie seu primeiro tópico para começar a organizar a estrutura da matéria.</p>
          </div>
        ) : (
          topicos.map(topico => {
            const assuntosDoTopico = assuntos.filter(a => a.topico_id === topico.id)
            return (
              <div key={topico.id} className="relative group/topico">
                
                {/* Linha do Tópico */}
                <div className="flex items-end justify-between border-b-2 border-slate-200 pb-2 mb-3">
                  <h2 className="text-xl font-extrabold text-slate-900 group-hover/topico:text-primary-700 transition-colors">
                    {topico.name}
                  </h2>
                  <div className="flex items-center gap-1 opacity-0 group-hover/topico:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingTopico(topico); setEditTopicoName(topico.name) }} className="p-1.5 text-slate-400 hover:text-primary-600 rounded-md transition" title="Editar tópico"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setActiveTopicoId(topico.id)} className="p-1.5 text-slate-400 hover:text-primary-600 rounded-md transition" title="Novo assunto"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>

                {/* Lista de Assuntos */}
                <div className="flex flex-col gap-1 pl-2 md:pl-4">
                  {assuntosDoTopico.length === 0 ? (
                    <div className="py-2 text-sm text-slate-400 font-medium italic">Sem conteúdos cadastrados.</div>
                  ) : (
                    assuntosDoTopico.map(assunto => (
                      <div key={assunto.id} className="group/assunto flex items-center justify-between py-2 px-2 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleToggleAssunto(assunto.id, assunto.is_done)}>
                          <div className={`w-5 h-5 border-[2px] rounded-full flex items-center justify-center flex-shrink-0 transition-all ${assunto.is_done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover/assunto:border-primary-400 bg-white'}`}>
                            {assunto.is_done && <Check className="w-3 h-3 text-white stroke-[4]" />}
                          </div>
                          <span className={`text-base font-semibold transition-colors ${assunto.is_done ? 'text-slate-400 line-through' : 'text-slate-700 group-hover/assunto:text-slate-900'}`}>
                            {assunto.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {assunto.duration_minutes > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold uppercase tracking-wider">{formatDuration(assunto.duration_minutes)}</span>
                            </div>
                          )}
                          <div className="flex gap-1 opacity-0 group-hover/assunto:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingAssunto(assunto); setEditAssuntoName(assunto.name) }} className="p-1.5 text-slate-400 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 rounded-lg transition" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                          </div>
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

      {/* Modais de Tópico e Assunto (Mesma lógica mantida, apenas ajuste visual) */}
      {isTopicoModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay" onClick={() => setIsTopicoModalOpen(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Novo Tópico</h3>
              <button onClick={() => setIsTopicoModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <input type="text" value={newTopicoName} onChange={e => setNewTopicoName(e.target.value)} placeholder="Ex: Matemática Básica" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 mb-6 font-medium bg-white" autoFocus />
            <button onClick={handleCreateTopico} disabled={!newTopicoName.trim()} className="w-full py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">Criar Tópico</button>
          </div>
        </div>
      )}

      {editingTopico && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay" onClick={() => setEditingTopico(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Editar Tópico</h3>
              <button onClick={() => setEditingTopico(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <input type="text" value={editTopicoName} onChange={e => setEditTopicoName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 mb-6 font-medium bg-white" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => setTopicoToDelete(editingTopico.id)} className="flex items-center justify-center p-2.5 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"><Trash2 className="w-5 h-5" /></button>
              <button onClick={handleEditTopico} disabled={!editTopicoName.trim() || editTopicoName === editingTopico.name} className="flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {activeTopicoId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay" onClick={() => setActiveTopicoId(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Novo Assunto</h3>
              <button onClick={() => setActiveTopicoId(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <input type="text" value={newAssuntoName} onChange={e => setNewAssuntoName(e.target.value)} placeholder="Ex: Frações" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 mb-6 font-medium bg-white" autoFocus />
            <button onClick={handleCreateAssunto} disabled={!newAssuntoName.trim()} className="w-full py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">Adicionar Assunto</button>
          </div>
        </div>
      )}

      {editingAssunto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay" onClick={() => setEditingAssunto(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Editar Assunto</h3>
              <button onClick={() => setEditingAssunto(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <input type="text" value={editAssuntoName} onChange={e => setEditAssuntoName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 mb-6 font-medium bg-white" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => setAssuntoToDelete(editingAssunto.id)} className="flex items-center justify-center p-2.5 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"><Trash2 className="w-5 h-5" /></button>
              <button onClick={handleEditAssunto} disabled={!editAssuntoName.trim() || editAssuntoName === editingAssunto.name} className="flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">Salvar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!topicoToDelete} title="Excluir Tópico" message="Deseja excluir este tópico e todos os seus assuntos?" onConfirm={executeDeleteTopico} onCancel={() => setTopicoToDelete(null)} isLoading={isDeletingItems} />
      <ConfirmModal isOpen={!!assuntoToDelete} title="Excluir Assunto" message="Deseja excluir este assunto?" onConfirm={executeDeleteAssunto} onCancel={() => setAssuntoToDelete(null)} isLoading={isDeletingItems} />
    </>
  )
}