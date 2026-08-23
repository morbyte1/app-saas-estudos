'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Target, TrendingUp, Plus, Medal, Flame, Check, X, Edit2, Trash2 } from 'lucide-react'
import { getCalendarData, createSubject } from './calendario/actions'
import { getTasks, createTask, updateTask, deleteTask, toggleTaskStatus } from './actions'

interface Event {
  id: string
  title: string
  time: string
  duration: number
  subject_id: string
  is_done: boolean
  event_date: string
}

interface Subject {
  id: string
  name: string
  color: string
}

interface Task {
  id: string
  title: string
  subject_id: string
  priority: 'baixa' | 'normal' | 'alta'
  is_done: boolean
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estados do Modal de Tarefas
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskModalData, setTaskModalData] = useState<{
    title: string;
    subjectId: string;
    priority: 'baixa' | 'normal' | 'alta';
  }>({
    title: '',
    subjectId: '',
    priority: 'normal'
  })

  // Estados para nova Tag (Subject) no modal de Tarefas
  const [showNewSubject, setShowNewSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectColor, setNewSubjectColor] = useState('#8b5cf6')
  const [isSavingSubject, setIsSavingSubject] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      
      // Busca dados do calendário (e subjects)
      const calendarResult = await getCalendarData()
      if (!calendarResult.error) {
        setEvents(calendarResult.events || [])
        setSubjects(calendarResult.subjects || [])
      }

      // Busca tarefas
      const tasksResult = await getTasks()
      if (!tasksResult.error) {
        setTasks(tasksResult.tasks || [])
      }

      setIsLoading(false)
    }
    fetchData()
  }, [])

  // Pega a data de hoje para filtrar os estudos do dia atual
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const dateString = `${year}-${month}-${day}`

  // Filtra eventos de hoje e ordena por horário
  const todaysEvents = events
    .filter(e => e.event_date && e.event_date.startsWith(dateString))
    .sort((a, b) => a.time.localeCompare(b.time))

  // Lógica para determinar status da tarefa ("Feito", "Próxima", "Depois")
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

  // Ordenação das Tarefas (Alta > Normal > Baixa)
  const priorityWeight = { alta: 3, normal: 2, baixa: 1 }
  const sortedTasks = [...tasks].sort((a, b) => {
    return priorityWeight[b.priority] - priorityWeight[a.priority]
  })

  // Funções utilitárias
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }

  const getSubjectColorStyle = (color: string) => {
    if (color && color.startsWith('#')) return { backgroundColor: color }
    return {}
  }

  const getSubjectColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    }
    if (color && color.startsWith('#')) return ''
    return colors[color || 'purple'] || colors.purple
  }

  const getSubjectTextColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'text-purple-600',
      blue: 'text-blue-600',
      green: 'text-green-600',
      orange: 'text-orange-600',
      red: 'text-red-600'
    }
    if (color && color.startsWith('#')) return ''
    return colors[color || 'purple'] || colors.purple
  }

  // --- Lógica de CRUD para Tarefas ---

  const openTaskModal = () => {
    setIsTaskModalOpen(true)
    setTaskModalData({
      title: '',
      subjectId: subjects.length > 0 ? subjects[0].id : '',
      priority: 'normal'
    })
    setEditingTaskId(null)
    setShowNewSubject(false)
  }

  const closeTaskModal = () => {
    setIsTaskModalOpen(false)
    setEditingTaskId(null)
  }

  const handleSaveSubjectForTask = async () => {
    if (!newSubjectName.trim()) return
    setIsSavingSubject(true)
    
    try {
      const result = await createSubject({
        name: newSubjectName,
        color: newSubjectColor
      })
      
      if (result.success) {
        const dataResult = await getCalendarData()
        if (!dataResult.error) {
          setSubjects(dataResult.subjects || [])
          const createdSubject = result.subject || dataResult.subjects?.find((s: Subject) => s.name === newSubjectName)
          setTaskModalData(prev => ({ 
            ...prev, 
            subjectId: createdSubject ? createdSubject.id : (dataResult.subjects?.[0]?.id || '')
          }))
          setNewSubjectName('')
          setNewSubjectColor('#8b5cf6')
        }
        setShowNewSubject(false)
      } else {
        alert('Não foi possível criar a matéria/tag.')
      }
    } finally {
      setIsSavingSubject(false)
    }
  }

  const handleSaveTask = async () => {
    if (!taskModalData.title.trim() || !taskModalData.subjectId) {
      alert("Por favor, preencha o nome da tarefa e selecione uma matéria (tag).")
      return
    }

    if (editingTaskId) {
      const result = await updateTask(editingTaskId, {
        title: taskModalData.title,
        subject_id: taskModalData.subjectId,
        priority: taskModalData.priority
      })
      
      if (result.success && result.task) {
        setTasks(tasks.map(t => t.id === editingTaskId ? result.task : t))
        closeTaskModal()
      } else {
        alert("Erro ao atualizar a tarefa.")
      }
    } else {
      const result = await createTask({
        title: taskModalData.title,
        subject_id: taskModalData.subjectId,
        priority: taskModalData.priority
      })
      
      if (result.success && result.task) {
        setTasks([...tasks, result.task])
        closeTaskModal()
      } else {
        alert("Erro ao criar a tarefa.")
      }
    }
  }

  const handleEditTask = (task: Task) => {
    setTaskModalData({
      title: task.title,
      subjectId: task.subject_id,
      priority: task.priority
    })
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
    if(result.success) {
      setTasks(tasks.map(t => t.id === id ? { ...t, is_done: !currentStatus } : t))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Seja bem-vindo, Lucas!</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">"O sucesso é a soma de pequenos esforços repetidos dia após dia." — Robert Collier</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-purple-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition">
            <Calendar className="w-4 h-4" />
            Hoje, 24 de Outubro
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Tempo Hoje</span>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">2h 35min</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Horas Totais</span>
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">48h</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Sequência</span>
              <div className="bg-amber-100 p-1.5 rounded-lg">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">12 dias</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Meta Diária</span>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Target className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-2">85%</p>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Meta Prova</span>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">Faltam 5 dias</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Matérias em Destaque</h2>
                <Link href="#" className="text-purple-600 text-sm font-medium hover:text-purple-700">
                  Ver todas
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">Matemática</span>
                    <span className="text-slate-500 text-xs font-medium">2h 15min</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 text-sm">Meta semanal</span>
                    <span className="text-slate-900 text-sm font-bold">80%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full mt-2">
                    <div className="h-full bg-purple-600 rounded-full w-[80%]"></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">Física</span>
                    <span className="text-slate-500 text-xs font-medium">1h 45min</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 text-sm">Meta semanal</span>
                    <span className="text-slate-900 text-sm font-bold">65%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full mt-2">
                    <div className="h-full bg-green-600 rounded-full w-[65%]"></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">Química</span>
                    <span className="text-slate-500 text-xs font-medium">1h 20min</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 text-sm">Meta semanal</span>
                    <span className="text-slate-900 text-sm font-bold">50%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full mt-2">
                    <div className="h-full bg-purple-600 rounded-full w-[50%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 mt-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">Cronograma de Hoje</h2>
                <Link href="/dashboard/calendario" className="text-sm text-purple-600 font-medium hover:text-purple-700 transition">
                  Ir ao calendário →
                </Link>
              </div>
              <div className="flex flex-col gap-4">
                {isLoading ? (
                  <div className="text-center text-slate-500 py-6 text-sm font-medium">
                    Carregando cronograma...
                  </div>
                ) : eventsWithStatus.length === 0 ? (
                  <div className="text-center text-slate-500 py-6 text-sm font-medium">
                    Nenhum estudo planejado para hoje no calendário.
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
                            <span className="bg-purple-100 text-purple-700 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide">Próxima</span>
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
                <h2 className="text-lg font-bold text-slate-900">Lista de Tarefas</h2>
                <button 
                  onClick={openTaskModal}
                  className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center text-slate-500 py-4 text-sm">Carregando tarefas...</div>
                ) : sortedTasks.length === 0 ? (
                  <div className="text-center text-slate-500 py-4 text-sm border border-dashed border-slate-200 rounded-xl">
                    Nenhuma tarefa pendente
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

                        {/* Ações aparecerão no hover (em telas grandes) */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditTask(task)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition bg-white/90 shadow-sm border border-slate-100 lg:border-transparent lg:shadow-none"
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

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Medal className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Próxima Conquista</h3>
                  <p className="text-slate-500 text-sm">Falta muito pouco!</p>
                </div>
              </div>
              <p className="font-bold text-slate-900 mb-2">Maratonista de Estudos</p>
              <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
              <p className="text-purple-600 text-sm font-medium">9/10 horas</p>
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
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      className="text-purple-600 text-xs font-bold flex items-center gap-1 hover:text-purple-700"
                    >
                      <Plus className="w-3 h-3" /> Nova Tag
                    </button>
                  )}
                </div>
                
                {!showNewSubject ? (
                  <select
                    value={taskModalData.subjectId}
                    onChange={(e) => setTaskModalData({ ...taskModalData, subjectId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="" disabled>Selecione uma matéria</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3 bg-purple-50 border border-purple-100 p-4 rounded-xl">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-purple-900">Criação de tags</h4>
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
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
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
                        className="px-4 py-2 h-10 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
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
                className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}