'use client'

import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ConfirmModal'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Target, TrendingUp, TrendingDown, Plus, Check, X, Edit2, Trash2, Library, ChevronRight, HelpCircle, AlertTriangle, Play, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ToastContext'
import { getTasks, createTask, updateTask, deleteTask, toggleTaskStatus, createExamGoal, updateExamGoal, deleteExamGoal, updateDailyGoal } from './actions'

interface Event { id: string; title: string; time: string; duration: number; subject_id: string; is_done: boolean; event_date: string }
interface Materia { id: string; name: string }
interface Task { id: string; title: string; materia_id?: string | null; tag_padrao?: string | null; priority: 'baixa' | 'normal' | 'alta'; is_done: boolean }

interface DashboardStats { 
  userName: string; 
  today: { minutes: number, goal: number, progress: number }
  overall: { totalStudyTime: string, questions: number, accuracy: number, accuracyChange: number }
  exam: { id: string, name: string, targetDate: string, daysRemaining: number } | null
  subjects: { id: string, name: string, weeklyGoal: number, weeklyStudied: number, goalProgress: number, expectedProgress: number, questions: number, accuracy: number | null, recentAccuracy: number | null, paceStatus: string, lastStudiedAt: string | null, sessionCount: number, medianDurationMinutes: number }[]
  diagnostics: { type: string, subjectName: string, message: string }[]
  recommendation: { materiaId?: string | null, subject: string, topic: string, duration: number, questions: number, accuracy: number | null, reason: string, action: string, actionUrl: string } | null
}

interface DashboardClientProps {
  initialEvents: Event[];
  initialTasks: Task[];
  initialStats: DashboardStats | null;
  initialMaterias: Materia[];
}

const TAGS_PADRAO = {
  simulado: { name: 'Simulado', colorClass: 'text-purple-600 bg-purple-100' },
  questoes: { name: 'Questões', colorClass: 'text-orange-600 bg-orange-100' },
  revisao: { name: 'Revisão', colorClass: 'text-blue-600 bg-blue-100' }
}

export default function DashboardClient({ initialEvents, initialTasks, initialStats, initialMaterias }: DashboardClientProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [materias, setMaterias] = useState<Materia[]>(initialMaterias)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [stats, setStats] = useState<DashboardStats | null>(initialStats)
  const { toast } = useToast()
  
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [examToDelete, setExamToDelete] = useState<string | null>(null)
  const [isDeletingBlock, setIsDeletingBlock] = useState(false)

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskModalData, setTaskModalData] = useState<{title: string; selection: string; priority: 'baixa' | 'normal' | 'alta';}>({title: '', selection: '', priority: 'normal'})

  const [isExamModalOpen, setIsExamModalOpen] = useState(false)
  const [editingExamId, setEditingExamId] = useState<string | null>(null)
  const [examForm, setExamForm] = useState({ name: '', date: '', time: '' })

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [selectedExam, setSelectedExam] = useState('')
  const [selectedHours, setSelectedHours] = useState(0)
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false)
  const [isManualHour, setIsManualHour] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const hasDoneOnboarding = localStorage.getItem('revyza_onboarding_done')
    if (!hasDoneOnboarding && initialMaterias.length === 0 && !initialStats?.exam) {
      setShowOnboarding(true)
    }
  }, [initialMaterias.length, initialStats?.exam])

  useEffect(() => {
    const mainElement = document.getElementById('main-scroll-container')
    
    if (isTaskModalOpen || isExamModalOpen || showOnboarding) {
      document.body.classList.add('overflow-hidden')
      mainElement?.classList.add('!overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
      mainElement?.classList.remove('!overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
      mainElement?.classList.remove('!overflow-hidden')
    }
  }, [isTaskModalOpen, isExamModalOpen, showOnboarding])

  const today = new Date()
  const formattedToday = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const capitalizedToday = formattedToday.charAt(0).toUpperCase() + formattedToday.slice(1)
  const router = useRouter()
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
    if (event.is_done) status = 'Feito'
    else if (!foundNext) { status = 'Próxima'; foundNext = true } 
    else status = 'Depois'
    return { ...event, status }
  })

  const priorityWeight = { alta: 3, normal: 2, baixa: 1 }
  const sortedTasks = [...tasks].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])

  const handleSaveOnboarding = async () => {
    setIsSavingOnboarding(true)
    const hoursRes = await updateDailyGoal(selectedHours)
    if (hoursRes.error) {
      toast("Erro ao salvar horas diárias.", "error")
      setIsSavingOnboarding(false)
      return
    }

    if (selectedExam === 'ENEM') {
      const targetDate = new Date('2026-11-08T13:00:00').toISOString()
      let goalRes
      if (stats?.exam) goalRes = await updateExamGoal(stats.exam.id, { name: 'ENEM 2026', target_date: targetDate })
      else goalRes = await createExamGoal({ name: 'ENEM 2026', target_date: targetDate })
      if (!goalRes.error) router.refresh()
    } else {
      if (stats?.exam) await deleteExamGoal(stats.exam.id)
      router.refresh()
    }

    toast("Pronto! Tudo configurado.", "success")
    localStorage.setItem('revyza_onboarding_done', 'true')
    setShowOnboarding(false)
    setIsSavingOnboarding(false)
  }

  const openTaskModal = () => {
    setIsTaskModalOpen(true)
    setTaskModalData({ title: '', selection: materias.length > 0 ? `materia:${materias[0].id}` : 'tag:simulado', priority: 'normal' })
    setEditingTaskId(null)
  }
  const closeTaskModal = () => { setIsTaskModalOpen(false); setEditingTaskId(null) }

  const handleSaveTask = async () => {
    if (!taskModalData.title.trim() || !taskModalData.selection) return toast("Por favor, preencha o nome e selecione uma categoria.", "error")
    const isMateria = taskModalData.selection.startsWith('materia:')
    const isTag = taskModalData.selection.startsWith('tag:')
    const materia_id = isMateria ? taskModalData.selection.replace('materia:', '') : null
    const tag_padrao = isTag ? taskModalData.selection.replace('tag:', '') : null

    if (editingTaskId) {
      const result = await updateTask(editingTaskId, { title: taskModalData.title, materia_id, tag_padrao, priority: taskModalData.priority })
      if (result.success && result.task) { setTasks(tasks.map(t => t.id === editingTaskId ? result.task : t)); closeTaskModal() }
    } else {
      const result = await createTask({ title: taskModalData.title, materia_id, tag_padrao, priority: taskModalData.priority })
      if (result.success && result.task) { setTasks([...tasks, result.task]); closeTaskModal() }
    }
  }

  const handleEditTask = (task: Task) => {
    let selection = ''
    if (task.materia_id) selection = `materia:${task.materia_id}`
    else if (task.tag_padrao) selection = `tag:${task.tag_padrao}`
    setTaskModalData({ title: task.title, selection, priority: task.priority })
    setEditingTaskId(task.id)
    setIsTaskModalOpen(true)
  }

  const executeDeleteTask = async () => {
    if (!taskToDelete) return
    setIsDeletingBlock(true)
    const result = await deleteTask(taskToDelete)
    if(result.success) setTasks(tasks.filter(t => t.id !== taskToDelete))
    setIsDeletingBlock(false)
    setTaskToDelete(null)
  }

  const handleToggleTask = async (id: string, currentStatus: boolean) => {
    const result = await toggleTaskStatus(id, !currentStatus)
    if(result.success) setTasks(tasks.map(t => t.id === id ? { ...t, is_done: !currentStatus } : t))
  }

  const openExamModal = (existingGoal?: { id: string, name: string, targetDate: string }) => {
    if (existingGoal) {
      const d = new Date(existingGoal.targetDate)
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
    if (!examForm.name || !examForm.date || !examForm.time) return toast("Preencha todos os campos da meta.", "error")
    const targetDate = new Date(`${examForm.date}T${examForm.time}:00`).toISOString()
    if (editingExamId) {
      await updateExamGoal(editingExamId, { name: examForm.name, target_date: targetDate })
    } else {
      await createExamGoal({ name: examForm.name, target_date: targetDate })
    }
    router.refresh()
    setIsExamModalOpen(false)
  }

  const executeDeleteExamGoal = async () => {
    if (!examToDelete) return
    setIsDeletingBlock(true)
    await deleteExamGoal(examToDelete)
    router.refresh()
    setIsDeletingBlock(false)
    setExamToDelete(null)
  }

  const renderTaskTag = (task: Task) => {
    if (task.tag_padrao) {
      const config = TAGS_PADRAO[task.tag_padrao as keyof typeof TAGS_PADRAO]
      if (config) return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${config.colorClass}`}>{config.name}</span>
    } else if (task.materia_id) {
      const mat = materias.find(m => m.id === task.materia_id)
      if (mat) return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary-100 text-primary-700">{mat.name}</span>
    }
    return null
  }

  const firstName = stats?.userName ? stats.userName.split(' ')[0] : 'Estudante'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center items-start mb-8 gap-4">
          <div>
            {!stats ? (
              <div className="h-9 w-64 bg-slate-200 rounded-lg animate-pulse mb-1"></div>
            ) : (
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bom estudo, {firstName}.</h1>
            )}
            <p className="text-sm text-slate-500 mt-2 font-medium">Veja o que fazer agora e como os seus estudos estão rendendo.</p>
          </div>
          <Link href="/dashboard/calendario" className="flex items-center gap-2 px-4 py-2 bg-white text-primary-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition shadow-sm">
            <Calendar className="w-4 h-4" />
            {capitalizedToday}
          </Link>
        </div>

        {/* RECOMENDAÇÃO E OBJETIVO */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-primary-900 rounded-3xl p-8 shadow-md text-white relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-600 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
              
              <div>
                <p className="text-primary-200 font-bold uppercase tracking-widest text-xs mb-5">Seu Próximo Estudo</p>
                {stats.recommendation && stats.recommendation.materiaId ? (
                  <>
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-1">{stats.recommendation.subject}</h2>
                    <h3 className="text-lg text-primary-100 font-medium mb-6">{stats.recommendation.topic}</h3>
                    
                    <div className="flex flex-wrap gap-3 mb-6">
                      <div className="flex items-center gap-2 bg-primary-800/60 px-3 py-1.5 rounded-lg border border-primary-700/50">
                        <Clock className="w-4 h-4 text-primary-300" />
                        <span className="text-sm font-semibold text-primary-50">{stats.recommendation.duration} min (sugerido)</span>
                      </div>
                      {stats.recommendation.questions > 0 && (
                        <div className="flex items-center gap-2 bg-primary-800/60 px-3 py-1.5 rounded-lg border border-primary-700/50">
                          <Target className="w-4 h-4 text-primary-300" />
                          <span className="text-sm font-semibold text-primary-50">Meta: {stats.recommendation.questions} questões</span>
                        </div>
                      )}
                      {stats.recommendation.accuracy !== null && stats.recommendation.accuracy > 0 && (
                        <div className="flex items-center gap-2 bg-primary-800/60 px-3 py-1.5 rounded-lg border border-primary-700/50">
                          <CheckCircle className="w-4 h-4 text-primary-300" />
                          <span className="text-sm font-semibold text-primary-50">{stats.recommendation.accuracy}% de precisão atual</span>
                        </div>
                      )}
                    </div>
                    <p className="text-primary-100/90 text-sm max-w-xl leading-relaxed mb-6">
                      {stats.recommendation.reason}
                    </p>
                  </>
                ) : (
                  <div className="py-6">
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-1">{stats.recommendation?.subject || 'Nenhuma matéria'}</h2>
                    <p className="text-primary-100 text-lg mt-4">{stats.recommendation?.reason || 'Adicione suas matérias no painel para receber recomendações personalizadas.'}</p>
                  </div>
                )}
              </div>

              <div>
                {stats.recommendation && stats.recommendation.materiaId ? (
                  <Link href={stats.recommendation.actionUrl} className="inline-flex items-center gap-2 bg-white text-primary-900 px-6 py-3.5 rounded-xl font-bold hover:bg-primary-50 transition-colors shadow-sm">
                    <Play className="w-4 h-4 fill-current" />
                    {stats.recommendation.action}
                  </Link>
                ) : (
                  <Link href={stats.recommendation?.actionUrl || '/dashboard/materias'} className="inline-flex items-center gap-2 bg-white text-primary-900 px-6 py-3.5 rounded-xl font-bold hover:bg-primary-50 transition-colors shadow-sm">
                    <Play className="w-4 h-4 fill-current" />
                    {stats.recommendation?.action || 'Ir para Matérias'}
                  </Link>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Seu Objetivo</span>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Target className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                {stats.exam ? (
                  <div className="group relative">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-extrabold text-slate-900 truncate">{stats.exam.name}</h3>
                      <button onClick={() => openExamModal(stats.exam!)} className="text-slate-400 hover:text-primary-600 transition-colors p-1 opacity-0 group-hover:opacity-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-baseline gap-1 mt-3">
                      <span className="text-4xl font-extrabold text-slate-900">{stats.exam.daysRemaining}</span>
                      <span className="text-sm text-slate-500 font-medium">dias restantes</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-slate-500 mb-4">Você ainda não configurou uma meta principal.</p>
                    <button onClick={() => openExamModal()} className="px-4 py-2 bg-slate-50 text-primary-600 font-semibold rounded-lg hover:bg-slate-100 transition border border-slate-200">Configurar Meta</button>
                  </div>
                )}
              </div>

              {stats.subjects.length > 0 && stats.exam && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Ritmo de Estudo</p>
                  <div className="space-y-2">
                    {stats.subjects.slice(0,3).map(sub => (
                       <div key={sub.id} className="flex justify-between items-center text-sm">
                         <span className="font-medium text-slate-700 truncate pr-2">{sub.name}</span>
                         <span className={`font-bold text-xs px-2 py-0.5 rounded-md whitespace-nowrap ${
                           sub.paceStatus === 'acima_do_ritmo' ? 'bg-blue-100 text-blue-700' :
                           sub.paceStatus === 'no_ritmo' ? 'bg-emerald-100 text-emerald-700' :
                           sub.paceStatus === 'abaixo_do_ritmo' ? 'bg-amber-100 text-amber-700' :
                           sub.paceStatus === 'sem_dados' ? 'bg-slate-100 text-slate-600' :
                           'bg-red-100 text-red-700'
                         }`}>
                           {sub.paceStatus === 'acima_do_ritmo' ? 'Acima do Ritmo' : 
                            sub.paceStatus === 'no_ritmo' ? 'No Ritmo' : 
                            sub.paceStatus === 'abaixo_do_ritmo' ? 'Abaixo' : 
                            sub.paceStatus === 'sem_dados' ? 'Não iniciada' : 'Atrasada'}
                         </span>
                       </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DIAGNÓSTICOS (ATENÇÃO) */}
        {stats && stats.diagnostics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Onde você precisa de atenção</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.diagnostics.map((diag, i) => (
                <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-start gap-4">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    diag.type === 'meta' ? 'bg-amber-100 text-amber-600' : 
                    diag.type === 'precisao' ? 'bg-blue-100 text-blue-600' : 
                    'bg-red-100 text-red-600'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{diag.subjectName}</h3>
                    <p className="text-slate-500 text-sm mt-1 leading-snug font-medium">{diag.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DESEMPENHO (INTERPRETAÇÃO) */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Seu Desempenho</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Tempo Estudado</span>
                <span className="text-2xl font-extrabold text-slate-900">{stats.overall.totalStudyTime}</span>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Questões Feitas</span>
                <span className="text-2xl font-extrabold text-slate-900">{stats.overall.questions}</span>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Precisão Geral</span>
                <span className="text-2xl font-extrabold text-slate-900">{stats.overall.accuracy}%</span>
              </div>
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Evolução</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {stats.overall.accuracyChange > 0 ? '+' : ''}{stats.overall.accuracyChange} p.p.
                  </span>
                  {stats.overall.accuracyChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  ) : stats.overall.accuracyChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  ) : null}
                </div>
                <span className="text-xs text-slate-400 mt-1">esta semana</span>
              </div>
            </div>
          </div>
        )}

        {/* SUAS MATÉRIAS, CALENDÁRIO E TAREFAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Acompanhamento por Matéria</h2>
              <Link href="/dashboard/materias" className="text-primary-600 text-sm font-semibold hover:text-primary-700">Ver todas</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!stats ? (
                <div className="col-span-2 text-center text-sm py-4">Carregando...</div>
              ) : stats.subjects.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                  <Library className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-slate-500 text-sm mb-4">Nenhuma matéria para acompanhar.</p>
                  <Link href="/dashboard/materias" className="px-4 py-2 bg-slate-50 text-primary-600 font-semibold rounded-lg hover:bg-slate-100 transition text-xs border border-slate-200">Configurar Matérias</Link>
                </div>
              ) : (
                stats.subjects.slice(0, 6).map(sub => (
                  <div key={sub.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900">{sub.name}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{sub.weeklyGoal}h semanais</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                        sub.paceStatus === 'acima_do_ritmo' ? 'bg-blue-100 text-blue-700' :
                        sub.paceStatus === 'no_ritmo' ? 'bg-emerald-100 text-emerald-700' :
                        sub.paceStatus === 'abaixo_do_ritmo' ? 'bg-amber-100 text-amber-700' :
                        sub.paceStatus === 'sem_dados' ? 'bg-slate-100 text-slate-600' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sub.paceStatus === 'acima_do_ritmo' ? 'Acima do Ritmo' : 
                         sub.paceStatus === 'no_ritmo' ? 'No Ritmo' : 
                         sub.paceStatus === 'abaixo_do_ritmo' ? 'Abaixo' : 
                         sub.paceStatus === 'sem_dados' ? 'Não iniciada' : 'Atrasada'}
                      </span>
                    </div>
                    
                    {sub.paceStatus === 'sem_dados' ? (
                      <div className="py-4 mt-2 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <span className="text-sm font-medium text-slate-500">Nenhum estudo registrado</span>
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-600 text-xs font-medium">Progresso da meta</span>
                          <span className="text-slate-900 text-xs font-bold">{sub.goalProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4 relative">
                          <div className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10" style={{ left: `${sub.expectedProgress}%` }}></div>
                          <div className="h-full bg-primary-600 rounded-full transition-all duration-500" style={{ width: `${sub.goalProgress}%` }}></div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                            {sub.questions} qst
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Target className="w-3.5 h-3.5 text-slate-400" />
                            {sub.accuracy || 0}% prec
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">Planejado para hoje</h2>
                <Link href="/dashboard/calendario" className="text-sm text-primary-600 font-semibold hover:text-primary-700">Ver Agenda</Link>
              </div>
              <div className="flex flex-col gap-3">
                {eventsWithStatus.length === 0 ? (
                  <p className="text-center text-slate-500 py-4 text-sm font-medium border border-dashed border-slate-200 rounded-xl">Sem planejamento no calendário hoje.</p>
                ) : (
                  eventsWithStatus.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 py-1">
                      <div className="w-12 text-slate-900 font-bold text-sm text-right">{event.time}</div>
                      <div className="w-1.5 h-8 rounded-full bg-primary-300"></div>
                      <div className={`flex-1 text-sm font-semibold ${event.is_done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{event.title}</div>
                      <div>
                        {event.status === 'Feito' && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded font-bold uppercase">Feito</span>}
                        {event.status === 'Próxima' && <span className="bg-primary-100 text-primary-700 text-[10px] px-2 py-1 rounded font-bold uppercase">Próxima</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">Tarefas Manuais</h2>
                <button onClick={openTaskModal} className="bg-primary-50 text-primary-600 p-2 rounded-lg hover:bg-primary-100 transition"><Plus className="w-4 h-4" /></button>
              </div>
              
              <div className="space-y-3">
                {sortedTasks.length === 0 ? (
                  <p className="text-center text-slate-500 py-4 text-sm border border-dashed border-slate-200 rounded-xl">Nenhuma tarefa pendente.</p>
                ) : (
                  sortedTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 border border-slate-100 rounded-xl p-3 group relative hover:border-slate-200 transition">
                      <div
                        onClick={() => handleToggleTask(task.id, task.is_done)}
                        className={`w-5 h-5 border-2 rounded flex-shrink-0 cursor-pointer flex items-center justify-center mt-0.5 ${task.is_done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}
                      >
                        {task.is_done && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0 pr-12">
                        <p className={`font-medium break-words leading-snug text-sm ${task.is_done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                          {renderTaskTag(task)}
                        </div>
                      </div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditTask(task)} className="p-1.5 text-slate-400 hover:text-primary-600 rounded-md transition"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setTaskToDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-overlay">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-modal relative">
            <button onClick={() => { setShowOnboarding(false); localStorage.setItem('revyza_onboarding_done', 'true') }} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X className="w-5 h-5" />
            </button>
            {onboardingStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-center mb-4"><div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600"><Target className="w-6 h-6" /></div></div>
                <div className="flex items-center justify-center gap-2 mb-2 relative">
                  <h2 className="text-2xl font-extrabold text-slate-900 text-center">Qual prova você vai fazer?</h2>
                  <div className="relative flex items-center" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} onClick={() => setShowTooltip(!showTooltip)}>
                    <HelpCircle className="w-5 h-5 text-slate-400 cursor-help hover:text-primary-600 transition-colors" />
                    {showTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 bg-slate-900 text-white text-xs leading-relaxed rounded-xl shadow-xl z-[110] text-center">
                        Usamos essa informação para fornecer um modelo pré-configurado de matérias e assuntos.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-500 text-center mb-8">Selecione o seu objetivo principal.</p>
                <div className="space-y-3">
                  <button onClick={() => setSelectedExam('ENEM')} className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${selectedExam === 'ENEM' ? 'border-primary-600 bg-primary-50 shadow-sm' : 'border-slate-100 hover:border-primary-300 hover:bg-slate-50'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selectedExam === 'ENEM' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>EN</div>
                    <div className="text-left"><p className="font-bold text-slate-900">ENEM 2026</p><p className="text-xs text-slate-500">Exame Nacional do Ensino Médio</p></div>
                  </button>
                  <button onClick={() => setSelectedExam('NENHUMA')} className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${selectedExam === 'NENHUMA' ? 'border-primary-600 bg-primary-50 shadow-sm' : 'border-slate-100 hover:border-primary-300 hover:bg-slate-50'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selectedExam === 'NENHUMA' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>--</div>
                    <div className="text-left"><p className="font-bold text-slate-900">Não tenho prova específica</p><p className="text-xs text-slate-500">Quero apenas focar em estudar</p></div>
                  </button>
                </div>
                <button onClick={() => setOnboardingStep(2)} disabled={!selectedExam} className="w-full mt-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-md disabled:opacity-50">Continuar</button>
              </div>
            )}
            {onboardingStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 relative pt-4">
                <div className="flex justify-center mb-4"><div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600"><Clock className="w-6 h-6" /></div></div>
                <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Quantas horas por dia?</h2>
                <p className="text-sm text-slate-500 text-center mb-8">Defina uma meta realista.</p>
                <div className="grid grid-cols-2 gap-3">
                  {[2, 4, 6, 8].map(hours => (
                    <button key={hours} onClick={() => { setSelectedHours(hours); setIsManualHour(false); }} className={`p-4 rounded-2xl border-2 transition-all font-bold text-lg ${selectedHours === hours && !isManualHour ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-100 text-slate-600'}`}>{hours}h / dia</button>
                  ))}
                  {!isManualHour ? (
                    <button onClick={() => { setIsManualHour(true); setSelectedHours(0); }} className="col-span-2 p-4 rounded-2xl border-2 border-slate-100 text-slate-600 hover:bg-slate-50 font-bold text-sm">Digitar manualmente</button>
                  ) : (
                    <div className="col-span-2 p-4 rounded-2xl border-2 border-primary-600 bg-primary-50 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary-700">Horas diárias:</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" value={selectedHours || ''} onChange={(e) => setSelectedHours(parseInt(e.target.value) || 0)} className="w-20 px-3 py-1.5 border border-primary-300 rounded-lg text-center font-bold text-primary-900" />
                        <span className="text-sm font-bold text-primary-700">h / dia</span>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={handleSaveOnboarding} disabled={!selectedHours || isSavingOnboarding} className="w-full mt-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">{isSavingOnboarding ? 'Salvando...' : 'Finalizar Configuração'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-modal">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button onClick={closeTaskModal} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">O que precisa ser feito?</label>
                <input type="text" value={taskModalData.title} onChange={(e) => setTaskModalData({ ...taskModalData, title: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Prioridade</label>
                <select value={taskModalData.priority} onChange={(e) => setTaskModalData({ ...taskModalData, priority: e.target.value as 'baixa' | 'normal' | 'alta' })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500">
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                <select value={taskModalData.selection} onChange={(e) => setTaskModalData({ ...taskModalData, selection: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500">
                  <option value="" disabled>Selecione uma categoria</option>
                  <optgroup label="Padrões">
                    <option value="tag:simulado">Simulado</option>
                    <option value="tag:questoes">Questões</option>
                    <option value="tag:revisao">Revisão</option>
                  </optgroup>
                  {materias.length > 0 && (
                    <optgroup label="Suas Matérias">
                      {materias.map(m => <option key={m.id} value={`materia:${m.id}`}>{m.name}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeTaskModal} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition">Cancelar</button>
              <button onClick={handleSaveTask} className="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {isExamModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-modal">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingExamId ? 'Editar Meta' : 'Nova Meta de Prova'}</h3>
              <button onClick={() => setIsExamModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Meta</label>
                <input type="text" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Data da Prova</label>
                <input type="date" value={examForm.date} onChange={(e) => setExamForm({ ...examForm, date: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Horário</label>
                <input type="time" value={examForm.time} onChange={(e) => setExamForm({ ...examForm, time: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl" />
              </div>
            </div>
            <div className="flex gap-2 mt-8">
              {editingExamId && <button onClick={() => setExamToDelete(editingExamId)} className="flex items-center p-2.5 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"><Trash2 className="w-5 h-5" /></button>}
              <button onClick={() => setIsExamModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl">Cancelar</button>
              <button onClick={handleSaveExamGoal} disabled={!examForm.name || !examForm.date || !examForm.time} className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl disabled:opacity-50">Salvar Meta</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Excluir Tarefa"
        message="Tem certeza que deseja excluir esta tarefa?"
        confirmText="Sim, excluir"
        onConfirm={executeDeleteTask}
        onCancel={() => setTaskToDelete(null)}
        isLoading={isDeletingBlock}
      />
      <ConfirmModal
        isOpen={!!examToDelete}
        title="Excluir Meta de Prova"
        message="Tem certeza que deseja excluir sua meta de prova?"
        confirmText="Sim, excluir"
        onConfirm={executeDeleteExamGoal}
        onCancel={() => setExamToDelete(null)}
        isLoading={isDeletingBlock}
      />
    </div>
  )
}