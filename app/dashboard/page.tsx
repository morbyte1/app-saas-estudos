'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Target, TrendingUp, Plus, Flame, Check, X, Edit2, Trash2 } from 'lucide-react'
import { getCalendarData, createSubject } from './calendario/actions'
import { useToast } from '@/components/ToastContext'
import { getTasks, createTask, updateTask, deleteTask, toggleTaskStatus, getDashboardStats, createExamGoal, updateExamGoal, deleteExamGoal } from './actions'

// --- INTERFACES (mantenha iguais às originais) ---
interface Event { id: string; title: string; time: string; duration: number; subject_id: string; is_done: boolean; event_date: string }
interface Subject { id: string; name: string; color: string }
interface Task { id: string; title: string; subject_id: string; priority: 'baixa' | 'normal' | 'alta'; is_done: boolean }
interface TopSubject { id: string; name: string; goalHours: number; studiedHours: number; studiedMinutes: number; progress: number }
interface DashboardStats { todayMinutes: number; totalHours: number; totalDurationFormatted: string; currentStreak: number; maxStreak: number; examGoal: { id: string, name: string, target_date: string } | null; topSubjects: TopSubject[]; dailyGoalHours: number }

const QUOTES = [
  "“A excelência é um hábito.” — Aristóteles",
  "“A educação é a arma mais poderosa que você pode usar para mudar o mundo.” — Nelson Mandela",
  "“Não é que eu seja tão inteligente; é que fico com os problemas por mais tempo.” — Albert Einstein",
  "“O sucesso é a soma de pequenos esforços, repetidos dia após dia.” — Robert Collier",
  "“A maneira de começar é parar de falar e começar a fazer.” — Walt Disney",
  "“Você nunca sabe que resultados virão da sua ação. Mas se não fizer nada, não existirão resultados.” — Mahatma Gandhi"
]

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quoteOfDay, setQuoteOfDay] = useState(QUOTES[0])
  const { toast } = useToast()

  // Estados do Modal de Tarefas
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskModalData, setTaskModalData] = useState<{title: string; subjectId: string; priority: 'baixa' | 'normal' | 'alta';}>({title: '', subjectId: '', priority: 'normal'})

  // Estados para nova Tag
  const [showNewSubject, setShowNewSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectColor, setNewSubjectColor] = useState('#8b5cf6')
  const [isSavingSubject, setIsSavingSubject] = useState(false)

  // Estados para Meta de Prova
  const [isExamModalOpen, setIsExamModalOpen] = useState(false)
  const [editingExamId, setEditingExamId] = useState<string | null>(null)
  const [examForm, setExamForm] = useState({ name: '', date: '', time: '' })
  const [examCountdown, setExamCountdown] = useState({ days: 0, hours: 0, minutes: 0 })

  useEffect(() => {
    // Calculadora para rotacionar a frase diariamente
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - start.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    setQuoteOfDay(QUOTES[dayOfYear % QUOTES.length])

    const fetchData = async () => {
      setIsLoading(true)
      
      const [calendarResult, tasksResult, statsResult] = await Promise.all([
        getCalendarData(),
        getTasks(),
        getDashboardStats()
      ])

      if (!calendarResult.error) {
        setEvents(calendarResult.events || [])
        setSubjects(calendarResult.subjects || [])
      }
      if (!tasksResult.error) {
        setTasks(tasksResult.tasks || [])
      }
      if (statsResult?.success && statsResult.data) {
        setStats(statsResult.data as DashboardStats)
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  // Atualização do Countdown da Prova
  useEffect(() => {
    if (!stats?.examGoal?.target_date) return

    const calculateCountdown = () => {
      const target = new Date(stats.examGoal!.target_date).getTime()
      const now = new Date().getTime()
      const distance = target - now

      if (distance > 0) {
        setExamCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        })
      } else {
        setExamCountdown({ days: 0, hours: 0, minutes: 0 })
      }
    }

    calculateCountdown()
    const interval = setInterval(calculateCountdown, 60000)
    return () => clearInterval(interval)
  }, [stats?.examGoal])

  // Data formatada
  const today = new Date()
  const formattedToday = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const capitalizedToday = formattedToday.charAt(0).toUpperCase() + formattedToday.slice(1)

  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${day}`

  const todaysEvents = events
    .filter(e => e.event_date && e.event_date.startsWith(dateString))
    .sort((a, b) => a.time.localeCompare(b.time))

  let foundNext = false
  const eventsWithStatus = todaysEvents.map(event => {
    let status = ''
    if (event.is_done) {
      status = 'Feito'
    } else if (!foundNext) {
      status = 'Próxima'
      foundNext = true
    } else {
      status = 'Depois'
    }
    return { ...event, status }
  })

  const priorityWeight = { alta: 3, normal: 2, baixa: 1 }
  const sortedTasks = [...tasks].sort((a, b) => {
    return priorityWeight[b.priority] - priorityWeight[a.priority]
  })

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }

  const formatTodayMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    if (hours > 0) return `${hours}h ${mins}min`
    return `${mins}min`
  }

  const getSubjectColorStyle = (color: string) => {
    if (color && color.startsWith('#')) return { backgroundColor: color }
    return {}
  }

  const getSubjectColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-primary-500', blue: 'bg-blue-500', green: 'bg-green-500', orange: 'bg-orange-500', red: 'bg-red-500'
    }
    if (color && color.startsWith('#')) return ''
    return colors[color || 'purple'] || colors.purple
  }

  const getSubjectTextColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'text-primary-600', blue: 'text-blue-600', green: 'text-green-600', orange: 'text-orange-600', red: 'text-red-600'
    }
    if (color && color.startsWith('#')) return ''
    return colors[color || 'purple'] || colors.purple
  }

  const openTaskModal = () => {
    setIsTaskModalOpen(true)
    setTaskModalData({ title: '', subjectId: subjects.length > 0 ? subjects[0].id : '', priority: 'normal' })
    setEditingTaskId(null)
    setShowNewSubject(false)
  }
  const closeTaskModal = () => { setIsTaskModalOpen(false); setEditingTaskId(null) }

  const handleSaveSubjectForTask = async () => {
    if (!newSubjectName.trim()) return
    setIsSavingSubject(true)
    try {
      const result = await createSubject({ name: newSubjectName, color: newSubjectColor })
      if (result.success) {
        const dataResult = await getCalendarData()
        if (!dataResult.error) {
          setSubjects(dataResult.subjects || [])
          const createdSubject = result.subject || dataResult.subjects?.find((s: Subject) => s.name === newSubjectName)
          setTaskModalData(prev => ({ ...prev, subjectId: createdSubject ? createdSubject.id : (dataResult.subjects?.[0]?.id || '') }))
          setNewSubjectName('')
          setNewSubjectColor('#8b5cf6')
        }
        setShowNewSubject(false)
        toast("Matéria criada com sucesso!", "success")
      } else { 
        toast("Não foi possível criar a matéria/tag.", "error") 
      }
    } finally { setIsSavingSubject(false) }
  }

  const handleSaveTask = async () => {
    if (!taskModalData.title.trim() || !taskModalData.subjectId) {
      toast("Por favor, preencha o nome da tarefa e selecione uma matéria (tag).", "error")
      return
    }
    if (editingTaskId) {
      const result = await updateTask(editingTaskId, { title: taskModalData.title, subject_id: taskModalData.subjectId, priority: taskModalData.priority })
      if (result.success && result.task) { setTasks(tasks.map(t => t.id === editingTaskId ? result.task : t)); closeTaskModal() } 
      else { toast("Erro ao atualizar a tarefa.", "error") }
    } else {
      const result = await createTask({ title: taskModalData.title, subject_id: taskModalData.subjectId, priority: taskModalData.priority })
      if (result.success && result.task) { setTasks([...tasks, result.task]); closeTaskModal() } 
      else { toast("Erro ao criar a tarefa.", "error") }
    }
  }

  const handleEditTask = (task: Task) => {
    setTaskModalData({ title: task.title, subjectId: task.subject_id, priority: task.priority })
    setEditingTaskId(task.id)
    setIsTaskModalOpen(true)
    setShowNewSubject(false)
  }

  const handleDeleteTask = async (id: string) => {
    if(confirm("Tem certeza que deseja excluir esta tarefa?")) {
      const result = await deleteTask(id)
      if(result.success) setTasks(tasks.filter(t => t.id !== id))
    }
  }

  const handleToggleTask = async (id: string, currentStatus: boolean) => {
    const result = await toggleTaskStatus(id, !currentStatus)
    if(result.success) { setTasks(tasks.map(t => t.id === id ? { ...t, is_done: !currentStatus } : t)) }
  }

  const openExamModal = (existingGoal?: { id: string, name: string, target_date: string }) => {
    if (existingGoal) {
      const d = new Date(existingGoal.target_date)
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      setExamForm({ name: existingGoal.name, date, time })
      setEditingExamId(existingGoal.id)
    } else {
      setExamForm({ name: '', date: '', time: '' })
      setEditingExamId(null)
    }
    setIsExamModalOpen(true)
  }

  const handleSaveExamGoal = async () => {
    if (!examForm.name || !examForm.date || !examForm.time) {
      toast("Preencha todos os campos da meta.", "error")
      return
    }
    const targetDate = new Date(`${examForm.date}T${examForm.time}:00`).toISOString()
    
    if (editingExamId) {
      const result = await updateExamGoal(editingExamId, { name: examForm.name, target_date: targetDate })
      if (result.success && result.goal) {
        setStats(prev => prev ? { ...prev, examGoal: { id: result.goal.id, name: result.goal.name, target_date: result.goal.target_date } } : null)
        toast("Meta atualizada com sucesso!", "success")
      } else toast("Erro ao atualizar a meta.", "error")
    } else {
      const result = await createExamGoal({ name: examForm.name, target_date: targetDate })
      if (result.success && result.goal) {
        setStats(prev => prev ? { ...prev, examGoal: { id: result.goal.id, name: result.goal.name, target_date: result.goal.target_date } } : null)
        toast("Meta criada com sucesso!", "success")
      } else toast("Erro ao criar a meta.", "error")
    }
    setIsExamModalOpen(false)
  }

  const handleDeleteExamGoal = async (id: string) => {
    if(confirm("Tem certeza que deseja excluir sua meta de prova?")) {
      const result = await deleteExamGoal(id)
      if(result.success) {
        setStats(prev => prev ? { ...prev, examGoal: null } : null)
        setIsExamModalOpen(false)
      }
    }
  }

  // Progresso da Meta Diária (em %)
  const dailyProgressPercent = stats ? Math.min(Math.round((stats.todayMinutes / (stats.dailyGoalHours * 60)) * 100), 100) : 0

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bora estudar, Arthur?</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">{quoteOfDay}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-primary-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition">
            <Calendar className="w-4 h-4" />
            {capitalizedToday}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Foco de hoje</span>
              <div className="bg-primary-100 p-2 rounded-lg">
                <Clock className="w-4 h-4 text-primary-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {isLoading || !stats ? '...' : formatTodayMinutes(stats.todayMinutes)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Sua jornada</span>
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {isLoading || !stats ? '...' : stats.totalDurationFormatted}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Ofensiva</span>
              <div className="bg-amber-100 p-1.5 rounded-lg">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-2xl font-bold text-slate-900">
                {isLoading || !stats ? '...' : `${stats.currentStreak} dias`}
              </p>
              {!isLoading && stats && (
                <span className="text-[10px] text-slate-400 font-medium">Máxima: {stats.maxStreak} dias</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Meta do dia</span>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Target className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-2">{isLoading ? '...' : `${dailyProgressPercent}%`}</p>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${dailyProgressPercent}%` }}></div>
            </div>
          </div>

<div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Meu objetivo</span>
              <div className="bg-primary-100 p-2 rounded-lg">
                <Target className="w-4 h-4 text-primary-600" />
              </div>
            </div>
            {!isLoading && stats && stats.examGoal ? (
              <div className="flex flex-col mt-1 group">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700 truncate">{stats.examGoal.name}</p>
                  <button onClick={() => openExamModal(stats.examGoal!)} className="text-slate-400 hover:text-primary-600 transition-colors p-1">
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-slate-900">{examCountdown.days}</span>
                  <span className="text-xs text-slate-500 font-medium uppercase">dias</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {examCountdown.hours}h {examCountdown.minutes}min restantes
                </p>
              </div>
            ) : (
              <button 
                onClick={() => openExamModal()}
                className="mt-2 w-full py-1.5 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition"
              >
                Adicionar nova meta
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Minhas matérias</h2>
                <Link href="/dashboard/materias" className="text-primary-600 text-sm font-medium hover:text-primary-700">
                  Ver todas
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {isLoading || !stats ? (
                  <div className="col-span-3 text-center text-sm text-slate-500 py-4">Carregando...</div>
                ) : (stats.topSubjects || []).length === 0 ? (
                  <div className="col-span-3 bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center text-sm text-slate-500">
                    Nenhuma matéria cadastrada ou estudada.
                  </div>
                ) : (
                  stats.topSubjects.map(materia => (
                    <div key={materia.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-xs font-bold">
                          {materia.name}
                        </span>
                        <span className="text-slate-500 text-xs font-medium">
                          {materia.studiedHours}h {materia.studiedMinutes}min
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-600 text-sm">Meta semanal</span>
                        <span className="text-slate-900 text-sm font-bold">{materia.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-primary-600 rounded-full transition-all duration-500" 
                          style={{ width: `${materia.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 mt-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">Meu dia</h2>
                <Link href="/dashboard/calendario" className="text-sm text-primary-600 font-medium hover:text-primary-700 transition">
                  Ir ao calendário →
                </Link>
              </div>
              <div className="flex flex-col gap-4">
                {isLoading ? (
                  <div className="text-center text-slate-500 py-6 text-sm font-medium">
                    Carregando cronograma...
                  </div>
                ) : eventsWithStatus.length === 0 ? (
                  <div className="text-center text-slate-500 py-6 text-sm font-medium border border-dashed border-slate-200 rounded-xl">
                    Nada agendado para hoje. Aproveite para descansar ou adiantar revisões!
                  </div>
                ) : (
                  eventsWithStatus.map((event) => {
                    const subject = subjects.find(s => s.id === event.subject_id)
                    const colorClass = getSubjectColorClass(subject?.color || 'purple')
                    const colorStyle = getSubjectColorStyle(subject?.color || '')

                    return (
                      <div key={event.id} className="flex items-center gap-4">
                        <div className="w-16 flex flex-col">
                          <span className="text-slate-900 font-bold">{event.time}</span>
                          <span className="text-slate-400 text-xs">{formatDuration(event.duration)}</span>
                        </div>
                        <div 
                          className={`w-1 h-10 rounded-full mx-4 ${colorClass}`}
                          style={colorStyle}
                        ></div>
                        <div className={`flex-1 text-sm font-semibold ${event.is_done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {event.title}
                        </div>
                        <div>
                          {event.status === 'Feito' && (
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide">Feito</span>
                          )}
                          {event.status === 'Próxima' && (
                            <span className="bg-primary-100 text-primary-700 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide">Próxima</span>
                          )}
                          {event.status === 'Depois' && (
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide">Depois</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">O que preciso fazer</h2>
                <button 
                  onClick={openTaskModal}
                  className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center text-slate-500 py-4 text-sm">Carregando tarefas...</div>
                ) : sortedTasks.length === 0 ? (
                  <div className="text-center text-slate-500 py-4 text-sm border border-dashed border-slate-200 rounded-xl">
                    Tudo em dia por aqui 👍
                  </div>
                ) : (
                  sortedTasks.map(task => {
                    const subject = subjects.find(s => s.id === task.subject_id)
                    
                    return (
                      <div key={task.id} className="flex items-start gap-3 border border-slate-100 rounded-xl p-3 group relative hover:border-slate-200 transition">
                        <div
                          onClick={() => handleToggleTask(task.id, task.is_done)}
                          className={`w-5 h-5 border-2 rounded flex-shrink-0 cursor-pointer flex items-center justify-center mt-0.5 ${
                            task.is_done
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {task.is_done && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-12">
                          <p className={`font-medium break-words leading-snug ${task.is_done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                            {subject && (
                              <p 
                                className={`text-[11px] font-semibold break-words ${getSubjectTextColorClass(subject.color)}`}
                                style={subject.color?.startsWith('#') ? { color: subject.color } : {}}
                              >
                                {subject.name}
                              </p>
                            )}
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                              task.priority === 'alta' ? 'text-red-500' :
                              task.priority === 'normal' ? 'text-blue-500' : 'text-slate-400'
                            }`}>
                              Prioridade {task.priority}
                            </span>
                          </div>
                        </div>

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditTask(task)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition bg-white/90 shadow-sm border border-slate-100 lg:border-transparent lg:shadow-none"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition bg-white/90 shadow-sm border border-slate-100 lg:border-transparent lg:shadow-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE TAREFAS */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h3>
              <button onClick={closeTaskModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  O que precisa ser feito?
                </label>
                <input
                  type="text"
                  value={taskModalData.title}
                  onChange={(e) => setTaskModalData({ ...taskModalData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Resolver lista de exercícios..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prioridade
                </label>
                <select
                  value={taskModalData.priority}
                  onChange={(e) => setTaskModalData({ ...taskModalData, priority: e.target.value as 'baixa' | 'normal' | 'alta' })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Matéria (Tag)
                  </label>
                  {!showNewSubject && (
                    <button
                      type="button"
                      onClick={() => setShowNewSubject(true)}
                      className="text-primary-600 text-xs font-bold flex items-center gap-1 hover:text-primary-700"
                    >
                      <Plus className="w-3 h-3" /> Nova Tag
                    </button>
                  )}
                </div>
                
                {!showNewSubject ? (
                  <select
                    value={taskModalData.subjectId}
                    onChange={(e) => setTaskModalData({ ...taskModalData, subjectId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="" disabled>Selecione uma matéria</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3 bg-primary-50 border border-primary-100 p-4 rounded-xl">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-primary-900">Criação de tags</h4>
                      <button type="button" onClick={() => setShowNewSubject(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        placeholder="Ex: Biologia"
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Cor
                        </label>
                        <input
                          type="color"
                          value={newSubjectColor}
                          onChange={(e) => setNewSubjectColor(e.target.value)}
                          className="w-full h-10 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveSubjectForTask}
                        disabled={!newSubjectName.trim() || isSavingSubject}
                        className="px-4 py-2 h-10 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
                      >
                        {isSavingSubject ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeTaskModal}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTask}
                className="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE META DE PROVA */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingExamId ? 'Editar Meta' : 'Nova Meta de Prova'}</h3>
              <button onClick={() => setIsExamModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Meta</label>
                <input
                  type="text"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: ENEM, Concurso BB..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Data da Prova</label>
                <input
                  type="date"
                  value={examForm.date}
                  onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Horário</label>
                <input
                  type="time"
                  value={examForm.time}
                  onChange={(e) => setExamForm({ ...examForm, time: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-8">
              {editingExamId && (
                <button
                  onClick={() => handleDeleteExamGoal(editingExamId)}
                  className="flex items-center justify-center p-2.5 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                  title="Excluir Meta"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveExamGoal}
                disabled={!examForm.name || !examForm.date || !examForm.time}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                Salvar Meta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}