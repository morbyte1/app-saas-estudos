'use client'

import ConfirmModal from '@/components/ConfirmModal'
import { useState } from 'react'
import { Plus, Clock, BookOpen, Target, X, Trash2, Rocket, MoreVertical, AlertTriangle, Book, Percent } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastContext'
import { createMateria, updateMateria, deleteMateria, importEnemDataAction, Materia } from './actions'

interface Estatisticas {
  totalFocus: string
  progress: string
  activeSubjects: number
  dailyGoalHours: number
  examGoalName?: string | null
}

interface MateriasClientProps {
  initialMaterias: Materia[]
  initialEstatisticas: Estatisticas
}

// Helper para exibição amigável da data
function getRelativeTime(dateStr: string | null) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(today.getHours() - 3) // BRT
  const todayStr = today.toISOString().split('T')[0]
  if (dateStr === todayStr) return 'Hoje'

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ontem'

  const diffTime = Math.abs(today.getTime() - new Date(dateStr + 'T12:00:00Z').getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return `Há ${diffDays} dias`
}

const StatusBadge = ({ status }: { status: Materia['status'] }) => {
  const styles = {
    'Não iniciada': 'bg-slate-100 text-slate-600',
    'No ritmo': 'bg-primary-100 text-primary-700',
    'Atenção': 'bg-amber-100 text-amber-700',
    'Meta alcançada': 'bg-emerald-100 text-emerald-700'
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  )
}

export default function MateriasClient({ initialMaterias, initialEstatisticas }: MateriasClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [materias, setMaterias] = useState<Materia[]>(initialMaterias)
  const [estatisticas, setEstatisticas] = useState<Estatisticas>(initialEstatisticas)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  
  const [materiaToDelete, setMateriaToDelete] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalData, setModalData] = useState({ name: '', goalHours: '' })

  const openCreateModal = () => {
    setEditingId(null)
    setModalData({ name: '', goalHours: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (materia: Materia) => {
    setEditingId(materia.id)
    setModalData({ name: materia.name, goalHours: materia.goalHours.toString() })
    setIsModalOpen(true)
    setOpenDropdownId(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!modalData.name.trim() || !modalData.goalHours) return toast('Preencha todos os campos.', 'error')
    setIsSaving(true)
    const goalNum = parseInt(modalData.goalHours)

    if (editingId) {
      const res = await updateMateria(editingId, { name: modalData.name, goalHours: goalNum })
      if (res.success) {
        toast('Matéria atualizada!', 'success')
        window.location.reload()
      } else toast('Erro ao atualizar.', 'error')
    } else {
      const res = await createMateria({ name: modalData.name, goalHours: goalNum })
      if (res.success) {
        toast('Matéria criada!', 'success')
        window.location.reload()
      } else toast('Erro ao criar.', 'error')
    }
    setIsSaving(false)
    closeModal()
  }

  const executeDeleteMateria = async () => {
    if (!materiaToDelete) return
    setIsSaving(true)
    const res = await deleteMateria(materiaToDelete)
    if (res.success) {
      toast('Matéria excluída.', 'success')
      window.location.reload()
    } else toast('Erro ao excluir.', 'error')
    setIsSaving(false)
    setMateriaToDelete(null)
  }

  const handleImportEnem = async () => {
    setIsImporting(true)
    const res = await importEnemDataAction(estatisticas.dailyGoalHours)
    if (res.success) {
      toast('Trilha do ENEM importada! Atualizando...', 'success')
      setTimeout(() => window.location.reload(), 1500)
    } else {
      toast(`Erro: ${res.error}`, 'error')
      setIsImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8" onClick={() => setOpenDropdownId(null)}>
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Minhas Matérias</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium max-w-2xl">
              Este é o seu centro de organização. Defina suas metas, gerencie seus tópicos e acompanhe rapidamente como você está em cada disciplina.
            </p>
          </div>
          <button 
            onClick={openCreateModal}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition shadow-sm"
          >
            <Plus className="w-4.5 h-4.5" />
            Adicionar matéria
          </button>
        </div>

        {/* Resumo Compacto */}
        {materias.length > 0 && (
          <div className="mb-8 flex flex-col sm:flex-row flex-wrap items-center gap-x-4 gap-y-2 bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm w-full md:w-max">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Book className="w-4 h-4 text-primary-600" />
              {estatisticas.activeSubjects} matérias
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Clock className="w-4 h-4 text-primary-600" />
              {estatisticas.totalFocus} estudadas nesta semana
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Percent className="w-4 h-4 text-primary-600" />
              {estatisticas.progress} da meta semanal concluída
            </span>
          </div>
        )}

        {materias.length === 0 ? (
          <>
            {estatisticas.examGoalName === 'ENEM 2026' && (
              <div className="mb-6 w-full bg-primary-600 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[60px] pointer-events-none"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="bg-white/20 p-4 rounded-2xl flex-shrink-0">
                    <Rocket className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-extrabold mb-1">Deseja importar todos os conteúdos cobrados do ENEM?</h3>
                    <p className="text-primary-100 font-medium text-sm max-w-lg leading-relaxed">
                      Nós montamos uma grade completa e vamos distribuir as horas de estudo automaticamente com base na sua meta diária.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleImportEnem}
                  disabled={isImporting}
                  className="w-full md:w-auto px-8 py-3.5 bg-white text-primary-600 font-bold rounded-xl hover:bg-primary-50 transition shadow-sm disabled:opacity-75 whitespace-nowrap relative z-10"
                >
                  {isImporting ? 'Importando Conteúdo...' : 'Sim, importar trilha'}
                </button>
              </div>
            )}
            <div className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center shadow-sm">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <BookOpen className="w-12 h-12 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Sua organização começa aqui</h2>
              <p className="text-slate-500 text-sm mb-6 max-w-sm">Adicione sua primeira matéria e defina uma meta para iniciarmos o acompanhamento.</p>
              <button onClick={openCreateModal} className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition shadow-sm">
                Adicionar Primeira Matéria
              </button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {materias.map(materia => (
              <div
                key={materia.id}
                onClick={() => router.push(`/dashboard/materias/${materia.id}`)}
                className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group flex flex-col relative"
              >
                {/* Nome e Status */}
                <div className="flex justify-between items-start mb-5">
                  <div className="pr-6">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{materia.name}</h3>
                    <div className="mt-1.5"><StatusBadge status={materia.status} /></div>
                  </div>
                  <div className="absolute right-4 top-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === materia.id ? null : materia.id) }} 
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openDropdownId === materia.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-10" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEditModal(materia)} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium">Editar</button>
                        <button onClick={() => { setMateriaToDelete(materia.id); setOpenDropdownId(null) }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium">Excluir</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progresso Semanal */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-500">Progresso semanal</span>
                    <span className="text-xs font-bold text-slate-900">
                      {materia.studiedHours}h {materia.studiedMinutes}m <span className="text-slate-400 font-medium ml-1">/ {materia.goalHours}h</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${materia.progress}%` }}></div>
                  </div>
                </div>

                {/* Contexto e Histórico */}
                <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {getRelativeTime(materia.lastStudiedDate) || 'Sem histórico'}
                  </span>
                  
                  {materia.accuracy !== null && (
                    <span className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-slate-400" />
                      {materia.accuracy}% precisão
                    </span>
                  )}
                  
                  {materia.topicCount > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      {materia.topicCount} tópicos
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Sem tópicos
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay" onClick={closeModal}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-modal" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Matéria' : 'Nova Matéria'}</h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-lg transition"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome da matéria</label>
                <input type="text" value={modalData.name} onChange={e => setModalData({ ...modalData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white" placeholder="Ex: Matemática" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meta semanal (Horas)</label>
                <input type="number" min="1" value={modalData.goalHours} onChange={e => setModalData({ ...modalData, goalHours: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white" placeholder="Ex: 5" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving} className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50">{isSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar Exclusão */}
      <ConfirmModal
        isOpen={!!materiaToDelete}
        title="Excluir Matéria"
        message="Tem certeza que deseja excluir esta matéria? Todos os tópicos e assuntos vinculados serão apagados (isso não apaga o histórico do timer)."
        confirmText="Sim, excluir"
        onConfirm={executeDeleteMateria}
        onCancel={() => setMateriaToDelete(null)}
        isLoading={isSaving}
      />
    </div>
  )
}