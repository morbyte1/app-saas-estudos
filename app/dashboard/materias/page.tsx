'use client'

import { useState, useEffect } from 'react'
import { Plus, Clock, Percent, Book, BookOpen, Settings, Target, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ToastContext'
import { getEstatisticas, getMaterias, createMateria, updateMateria, deleteMateria, Materia } from './actions'

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
    <div className="bg-primary-50 p-3 rounded-xl text-primary-600">
      {icon}
    </div>
    <div>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
)

const SubjectCard = ({ materia, onEdit }: { materia: Materia, onEdit: (m: Materia) => void }) => (
  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-6">
      <h3 className="text-lg font-bold text-slate-900">{materia.name}</h3>
      <div className="flex items-center gap-1">
        <Link 
          href={`/dashboard/materias/${encodeURIComponent(materia.name)}`}
          title="Ver detalhes"
          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition flex items-center justify-center"
        >
          <BookOpen className="w-4.5 h-4.5" />
        </Link>
        <button 
          onClick={() => onEdit(materia)} 
          title="Configurações"
          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
    
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
        <Target className="w-4 h-4 text-slate-400" />
        <span>Meta: {materia.goalHours}h/semana</span>
      </div>
      <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
        <Clock className="w-4 h-4 text-slate-400" />
        <span>Estudado: {materia.studiedHours}h {materia.studiedMinutes}min</span>
      </div>
    </div>
    
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-slate-700">Progresso semanal</span>
        <span className="text-sm font-bold text-primary-600">{materia.progress}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className="bg-primary-600 h-2 rounded-full transition-all duration-500" style={{ width: `${materia.progress}%` }}></div>
      </div>
    </div>
  </div>
)

export default function MateriasPage() {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [estatisticas, setEstatisticas] = useState({ totalFocus: '', progress: '', activeSubjects: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalData, setModalData] = useState({ name: '', goalHours: '' })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    const [statsResult, materiasResult] = await Promise.all([
      getEstatisticas(),
      getMaterias()
    ])

    if (statsResult.success && statsResult.data) {
      setEstatisticas(statsResult.data)
    }
    if (materiasResult.success && materiasResult.data) {
      setMaterias(materiasResult.data)
    }
    setIsLoading(false)
  }

  const openCreateModal = () => {
    setEditingId(null)
    setModalData({ name: '', goalHours: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (materia: Materia) => {
    setEditingId(materia.id)
    setModalData({ name: materia.name, goalHours: materia.goalHours.toString() })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!modalData.name.trim() || !modalData.goalHours) {
      toast('Preencha todos os campos.', 'error')
      return
    }

    setIsSaving(true)
    const goalNum = parseInt(modalData.goalHours)

    if (editingId) {
      const result = await updateMateria(editingId, { name: modalData.name, goalHours: goalNum })
      if (result.success) {
        setMaterias(materias.map(m => m.id === editingId ? { ...m, name: modalData.name, goalHours: goalNum } : m))
        toast('Matéria atualizada com sucesso!', 'success')
      } else {
        toast('Erro ao atualizar a matéria.', 'error')
      }
    } else {
      const result = await createMateria({ name: modalData.name, goalHours: goalNum })
      if (result.success && result.data) {
        setMaterias([...materias, result.data])
        setEstatisticas(prev => ({ ...prev, activeSubjects: prev.activeSubjects + 1 }))
        toast('Matéria criada com sucesso!', 'success')
      } else {
        toast('Erro ao criar a matéria.', 'error')
      }
    }

    setIsSaving(false)
    closeModal()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta matéria? Todos os dados vinculados também poderão ser perdidos.")) {
      setIsSaving(true)
      const result = await deleteMateria(id)
      if (result.success) {
        setMaterias(materias.filter(m => m.id !== id))
        toast('Matéria excluída com sucesso.', 'success')
        closeModal()
      } else {
        toast('Erro ao excluir matéria.', 'error')
      }
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Minhas Matérias</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Organize seus objetivos e acompanhe sua consistência a cada semana</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition shadow-sm"
          >
            <Plus className="w-4.5 h-4.5" />
            Adicionar matéria
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500 font-medium">Carregando informações...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard 
                icon={<Clock className="w-6 h-6" />} 
                label="Meu foco na semana" 
                value={estatisticas.totalFocus} 
              />
              <StatCard 
                icon={<Percent className="w-6 h-6" />} 
                label="Meu progresso médio" 
                value={estatisticas.progress} 
              />
              <StatCard 
                icon={<Book className="w-6 h-6" />} 
                label="Minhas matérias ativas" 
                value={`${estatisticas.activeSubjects} Matérias`} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {materias.map(materia => (
                <SubjectCard 
                  key={materia.id} 
                  materia={materia} 
                  onEdit={openEditModal} 
                />
              ))}
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingId ? 'Editar matéria' : 'Nova matéria'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome da matéria
                </label>
                <input
                  type="text"
                  value={modalData.name}
                  onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  placeholder="Ex: Matemática"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta semanal (Horas)
                </label>
                <input
                  type="number"
                  min="1"
                  value={modalData.goalHours}
                  onChange={(e) => setModalData({ ...modalData, goalHours: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  placeholder="Ex: 5"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-8">
              {editingId && (
                <button
                  onClick={() => handleDelete(editingId)}
                  disabled={isSaving}
                  className="flex items-center justify-center p-2.5 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition disabled:opacity-50"
                  title="Excluir Matéria"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}