'use client'

import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ConfirmModal'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Target, TrendingUp, Plus, Flame, Check, X, Edit2, Trash2, Library, BookOpen, ChevronLeft, HelpCircle } from 'lucide-react'
import { useToast } from '@/components/ToastContext'
import { getTasks, createTask, updateTask, deleteTask, toggleTaskStatus, createExamGoal, updateExamGoal, deleteExamGoal, updateDailyGoal } from './actions'

interface Event { id: string; title: string; time: string; duration: number; subject_id: string; is_done: boolean; event_date: string }
interface Materia { id: string; name: string }
interface Task { id: string; title: string; materia_id?: string | null; tag_padrao?: string | null; priority: 'baixa' | 'normal' | 'alta'; is_done: boolean }
interface TopSubject { id: string; name: string; goalHours: number; studiedHours: number; studiedMinutes: number; progress: number }
interface DashboardStats { userName: string; todayMinutes: number; totalHours: number; totalDurationFormatted: string; currentStreak: number; maxStreak: number; examGoal: { id: string, name: string, target_date: string } | null; topSubjects: TopSubject[]; dailyGoalHours: number }

interface DashboardClientProps {
  initialEvents: Event[];
  initialTasks: Task[];
  initialStats: DashboardStats | null;
  initialMaterias: Materia[];
}

const QUOTES = [
  "A aprovação não vem de um dia perfeito de 10 horas de estudo, mas da constância de fazer o seu melhor todos os dias.",
  "Não espere pela motivação, confie na disciplina. Feito com foco é sempre melhor do que o perfeito não feito.",
  "Cada questão que você acerta, ou entende porque errou, é um passo a menos entre você e a sua vaga.",
  "O estudo é o único investimento onde você não tem como sair perdendo. Ninguém tira o que você aprendeu hoje.",
  "Genialidade é só um nome bonito para quem teve a paciência de errar a mesma questão até aprender como faz.",
  "Ninguém nasce sabendo a matéria toda. O segredo é não pular o assunto só porque ele parece impossível agora.",
  "Sua vaga está sendo garantida agora, nessa revisão que você estava quase com preguiça e deixando pra amanhã.",
  "Um bloco de 30 minutos de foco absoluto rende muito mais do que uma tarde inteira 'estudando' com o celular do lado.",
  "O cronograma perfeito não faz a prova por você. Fecha as outras abas, dá o play no timer e só vai.",
  "A vontade de estudar raramente vem antes de sentar na cadeira. Ela aparece depois dos primeiros 10 minutos. Só começa.",
  "A ansiedade não resolve a prova e o cansaço faz parte. Foque no que você tem controle hoje: terminar essa lista.",
  "Na dúvida se vai dar certo no final do ano, estuda. Pelo menos você garante que a sua parte está sendo feita."
]

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
  const [quoteOfDay, setQuoteOfDay] = useState(QUOTES[0])
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
  const [examCountdown, setExamCountdown] = useState({ days: 0, hours: 0, minutes: 0 })

  // Estados de Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [selectedExam, setSelectedExam] = useState('')
  const [selectedHours, setSelectedHours] = useState(0)
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false)
  const [isManualHour, setIsManualHour] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Verifica primeiro login para exibir o onboarding
  useEffect(() => {
    const hasDoneOnboarding = localStorage.getItem('revyza_onboarding_done')
    if (!hasDoneOnboarding && initialMaterias.length === 0 && !initialStats?.examGoal) {
      setShowOnboarding(true)
    }
  }, [initialMaterias.length, initialStats?.examGoal])

  useEffect(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - start.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    setQuoteOfDay(QUOTES[dayOfYear % QUOTES.length])
  }, [])

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

  const getSubjectColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-primary-500', blue: 'bg-blue-500', green: 'bg-green-500', orange: 'bg-orange-500', red: 'bg-red-500'
    }
    if (color && color.startsWith('#')) return ''
    return colors[color || 'purple'] || colors.purple
  }

  // --- Handlers do Onboarding ---
  const handleSaveOnboarding = async () => {
    setIsSavingOnboarding(true)
    
    // 1. Atualizar horas diárias
    const hoursRes = await updateDailyGoal(selectedHours)
    if (hoursRes.error) {
      toast("Erro ao salvar horas diárias.", "error")
      setIsSavingOnboarding(false)
      return
    }

    // 2. Criar ou Atualizar a meta da Prova
    if (selectedExam === 'ENEM') {
      const targetDate = new Date('2026-11-08T13:00:00').toISOString()
      let goalRes
      if (stats?.examGoal) {
        goalRes = await updateExamGoal(stats.examGoal.id, { name: 'ENEM 2026', target_date: targetDate })
      } else {
        goalRes = await createExamGoal({ name: 'ENEM 2026', target_date: targetDate })
      }

      if (goalRes.error) {
        toast("Erro ao configurar meta do ENEM.", "error")
      } else if (goalRes.goal) {
        setStats(prev => prev ? { 
          ...prev, 
          dailyGoalHours: selectedHours,
          examGoal: { id: goalRes.goal.id, name: goalRes.goal.name, target_date: goalRes.goal.target_date } 
        } : null)
      }
    } else {
      // Se for "Nenhuma", deleta a meta existente se houver
      if (stats?.examGoal) {
        await deleteExamGoal(stats.examGoal.id)
        setStats(prev => prev ? { ...prev, dailyGoalHours: selectedHours, examGoal: null } : null)
      } else {
        setStats(prev => prev ? { ...prev, dailyGoalHours: selectedHours } : null)
      }
    }

    toast("Pronto! Tudo configurado.", "success")
    localStorage.setItem('revyza_onboarding_done', 'true')
    setShowOnboarding(false)
    setIsSavingOnboarding(false)
    
    // Força a sincronização com o Calendário e demais páginas do lado do cliente
    router.refresh()
  }

  // --- Handlers de Tarefas e Metas (existentes) ---
  const openTaskModal = () => {
    setIsTaskModalOpen(true)
    setTaskModalData({ title: '', selection: materias.length > 0 ? `materia:${materias[0].id}` : 'tag:simulado', priority: 'normal' })
    setEditingTaskId(null)
  }
  
  const closeTaskModal = () => { setIsTaskModalOpen(false); setEditingTaskId(null) }

  const handleSaveTask = async () => {
    if (!taskModalData.title.trim() || !taskModalData.selection) {
      toast("Por favor, preencha o nome da tarefa e selecione uma categoria.", "error")
      return
    }

    const isMateria = taskModalData.selection.startsWith('materia:')
    const isTag = taskModalData.selection.startsWith('tag:')
    
    const materia_id = isMateria ? taskModalData.selection.replace('materia:', '') : null
    const tag_padrao = isTag ? taskModalData.selection.replace('tag:', '') : null

    if (editingTaskId) {
      const result = await updateTask(editingTaskId, { 
        title: taskModalData.title, 
        materia_id, 
        tag_padrao,
        priority: taskModalData.priority 
      })
      if (result.success && result.task) { setTasks(tasks.map(t => t.id === editingTaskId ? result.task : t)); closeTaskModal() } 
      else { toast("Erro ao atualizar a tarefa.", "error") }
    } else {
      const result = await createTask({ 
        title: taskModalData.title, 
        materia_id, 
        tag_padrao, 
        priority: taskModalData.priority 
      })
      if (result.success && result.task) { setTasks([...tasks, result.task]); closeTaskModal() } 
      else { toast("Erro ao criar a tarefa.", "error") }
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
    if(result.success) {
      setTasks(tasks.filter(t => t.id !== taskToDelete))
      toast("Tarefa excluída!", "success")
    }
    setIsDeletingBlock(false)
    setTaskToDelete(null)
  }

  const handleDeleteTask = (id: string) => setTaskToDelete(id)

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

  const executeDeleteExamGoal = async () => {
    if (!examToDelete) return
    setIsDeletingBlock(true)
    const result = await deleteExamGoal(examToDelete)
    if(result.success) {
      setStats(prev => prev ? { ...prev, examGoal: null } : null)
      setIsExamModalOpen(false)
      toast("Meta de prova excluída!", "success")
    }
    setIsDeletingBlock(false)
    setExamToDelete(null)
  }

  const handleDeleteExamGoal = (id: string) => setExamToDelete(id)

  const renderTaskTag = (task: Task) => {
    if (task.tag_padrao) {
      const config = TAGS_PADRAO[task.tag_padrao as keyof typeof TAGS_PADRAO]
      if (config) {
        return (
          <p className={`text-[11px] font-semibold break-words px-2 py-0.5 rounded-md ${config.colorClass}`}>
            {config.name}
          </p>
        )
      }
    } else if (task.materia_id) {
      const mat = materias.find(m => m.id === task.materia_id)
      if (mat) {
        return (
          <p className="text-[11px] font-semibold break-words px-2 py-0.5 rounded-md bg-primary-100 text-primary-700">
            {mat.name}
          </p>
        )
      }
    }
    return null
  }

  const dailyProgressPercent = stats ? Math.min(Math.round((stats.todayMinutes / (stats.dailyGoalHours * 60)) * 100), 100) : 0
  const firstName = stats?.userName ? stats.userName.split(' ')[0] : 'Estudante'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center items-start mb-8 gap-4">
          <div>
            {!stats ? (
              <div className="h-9 w-64 bg-slate-200 rounded-lg animate-pulse mb-1"></div>
            ) : (
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bora estudar, {firstName}?</h1>
            )}
            <p className="text-sm text-slate-500 mt-2 font-medium">{quoteOfDay}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-primary-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition w-full sm:w-auto justify-center">
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
            {!stats ? (
              <div className="h-8 w-20 bg-slate-200 rounded-md animate-pulse mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-slate-900">{formatTodayMinutes(stats.todayMinutes)}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Sua jornada</span>
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            {!stats ? (
              <div className="h-8 w-24 bg-slate-200 rounded-md animate-pulse mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-slate-900">{stats.totalDurationFormatted}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Ofensiva</span>
              <div className="bg-amber-100 p-1.5 rounded-lg">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="flex flex-col">
              {!stats ? (
                <div className="h-8 w-16 bg-slate-200 rounded-md animate-pulse mt-1"></div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-900">{stats.currentStreak} dias</p>
                  <span className="text-[10px] text-slate-400 font-medium">Máxima: {stats.maxStreak} dias</span>
                </>
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
            {!stats ? (
              <div className="h-8 w-16 bg-slate-200 rounded-md animate-pulse mb-2"></div>
            ) : (
              <p className="text-2xl font-bold text-slate-900 mb-2">{dailyProgressPercent}%</p>
            )}
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
            {!stats ? (
              <div className="flex flex-col mt-1 gap-2 animate-pulse">
                <div className="h-5 w-3/4 bg-slate-200 rounded-md"></div>
                <div className="h-8 w-12 bg-slate-200 rounded-md"></div>
                <div className="h-3 w-1/2 bg-slate-200 rounded-md"></div>
              </div>
            ) : stats && stats.examGoal ? (
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
                {!stats ? (
                  <>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-pulse flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <div className="h-5 w-20 bg-slate-200 rounded-md"></div>
                          <div className="h-4 w-12 bg-slate-200 rounded-md"></div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
                          <div className="h-4 w-8 bg-slate-200 rounded-md"></div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full mt-1"></div>
                      </div>
                    ))}
                  </>
                ) : (stats.topSubjects || []).length === 0 ? (
                  <div className="col-span-3 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                    <Library className="w-10 h-10 text-slate-300 mb-3" />
                    <h3 className="text-slate-900 font-bold text-sm mb-1">Nenhuma matéria cadastrada</h3>
                    <p className="text-slate-500 text-xs mb-4">
                      Adicione matérias para ver seu progresso semanal por aqui.
                    </p>
                    <Link 
                      href="/dashboard/materias" 
                      className="px-4 py-2 bg-slate-50 text-primary-600 border border-slate-200 font-medium rounded-lg hover:bg-slate-100 transition text-xs"
                    >
                      Configurar Matérias
                    </Link>
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
                {!events ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 animate-pulse py-2">
                        <div className="w-16 flex flex-col gap-1.5">
                          <div className="h-4 w-12 bg-slate-200 rounded-md"></div>
                          <div className="h-3 w-8 bg-slate-200 rounded-md"></div>
                        </div>
                        <div className="w-1 h-10 rounded-full mx-4 bg-slate-200"></div>
                        <div className="flex-1 h-5 w-3/4 bg-slate-200 rounded-md"></div>
                        <div className="h-5 w-12 bg-slate-200 rounded-md"></div>
                      </div>
                    ))}
                  </>
                ) : eventsWithStatus.length === 0 ? (
                  <div className="text-center text-slate-500 py-6 text-sm font-medium border border-dashed border-slate-200 rounded-xl">
                    Nada agendado para hoje. Aproveite para descansar ou adiantar revisões!
                  </div>
                ) : (
                  eventsWithStatus.map((event) => {
                    const colorClass = getSubjectColorClass('purple')

                    return (
                      <div key={event.id} className="flex items-center gap-4">
                        <div className="w-16 flex flex-col">
                          <span className="text-slate-900 font-bold">{event.time}</span>
                          <span className="text-slate-400 text-xs">{formatDuration(event.duration)}</span>
                        </div>
                        <div 
                          className={`w-1 h-10 rounded-full mx-4 ${colorClass}`}
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
                {!tasks ? (
                  <>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-start gap-3 border border-slate-100 rounded-xl p-3 animate-pulse">
                        <div className="w-5 h-5 rounded bg-slate-200 flex-shrink-0 mt-0.5"></div>
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="h-4 w-11/12 bg-slate-200 rounded-md"></div>
                          <div className="flex gap-2">
                            <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
                            <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : sortedTasks.length === 0 ? (
                  <div className="text-center text-slate-500 py-4 text-sm border border-dashed border-slate-200 rounded-xl">
                    Tudo em dia por aqui 👍
                  </div>
                ) : (
                  sortedTasks.map(task => {
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
                            {renderTaskTag(task)}
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

      {/* MODAL DE ONBOARDING */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-overlay">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-modal relative overflow-hidden">
            <button onClick={() => {
              setShowOnboarding(false)
              localStorage.setItem('revyza_onboarding_done', 'true')
            }} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            
            {onboardingStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                    <Target className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-2 relative">
                  <h2 className="text-2xl font-extrabold text-slate-900 text-center">Qual prova você vai fazer?</h2>
                  <div 
                    className="relative flex items-center"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                  >
                    <HelpCircle className="w-5 h-5 text-slate-400 cursor-help hover:text-primary-600 transition-colors" />
                    {showTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 bg-slate-900 text-white text-xs leading-relaxed rounded-xl shadow-xl z-[110] text-center animate-in fade-in slide-in-from-bottom-1">
                        Usamos essa informação para fornecer um modelo pré-configurado de matérias e assuntos para estudar, economizando seu tempo nessa etapa. Caso não saiba ainda o que deseja ou quer configurar manualmente clique na segunda opção.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 text-center mb-8">Selecione o seu objetivo principal para configurarmos o sistema.</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedExam('ENEM')}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      selectedExam === 'ENEM' ? 'border-primary-600 bg-primary-50 shadow-sm' : 'border-slate-100 hover:border-primary-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      selectedExam === 'ENEM' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      EN
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">ENEM 2026</p>
                      <p className="text-xs text-slate-500">Exame Nacional do Ensino Médio</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedExam('NENHUMA')}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      selectedExam === 'NENHUMA' ? 'border-primary-600 bg-primary-50 shadow-sm' : 'border-slate-100 hover:border-primary-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      selectedExam === 'NENHUMA' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      --
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Não tenho prova específica</p>
                      <p className="text-xs text-slate-500">Quero apenas focar em estudar</p>
                    </div>
                  </button>
                </div>
                
                <button
                  onClick={() => setOnboardingStep(2)}
                  disabled={!selectedExam}
                  className="w-full mt-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 relative pt-4">
                <button 
                  onClick={() => setOnboardingStep(1)} 
                  className="absolute -top-4 -left-4 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-sm font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <div className="flex justify-center mb-4 mt-2">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Quantas horas por dia?</h2>
                <p className="text-sm text-slate-500 text-center mb-8">Defina uma meta realista. Qual a sua disponibilidade diária de estudos?</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {[2, 4, 6, 8].map(hours => (
                    <button
                      key={hours}
                      onClick={() => {
                        setSelectedHours(hours)
                        setIsManualHour(false)
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all font-bold text-lg ${
                        selectedHours === hours && !isManualHour ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm' : 'border-slate-100 hover:border-primary-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {hours}h{hours === 8 && '+'} / dia
                    </button>
                  ))}
                  
                  {!isManualHour ? (
                    <button
                      onClick={() => {
                        setIsManualHour(true)
                        setSelectedHours(0) 
                      }}
                      className="col-span-2 p-4 rounded-2xl border-2 border-slate-100 hover:border-primary-300 text-slate-600 hover:bg-slate-50 transition-all font-bold text-sm"
                    >
                      Digitar manualmente
                    </button>
                  ) : (
                    <div className="col-span-2 p-4 rounded-2xl border-2 border-primary-600 bg-primary-50 shadow-sm transition-all flex items-center justify-between">
                      <span className="text-sm font-bold text-primary-700">Horas diárias:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={selectedHours || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            if (!isNaN(val) && val > 0) setSelectedHours(val)
                            else setSelectedHours(0)
                          }}
                          onKeyDown={(e) => {
                            if (['.', ',', 'e', 'E', '-', '+'].includes(e.key)) e.preventDefault()
                          }}
                          className="w-20 px-3 py-1.5 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center font-bold text-primary-900 bg-white"
                          placeholder="Ex: 5"
                          autoFocus
                        />
                        <span className="text-sm font-bold text-primary-700">h / dia</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveOnboarding}
                  disabled={!selectedHours || isSavingOnboarding}
                  className="w-full mt-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingOnboarding ? 'Salvando...' : 'Finalizar Configuração'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE TAREFAS */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-modal">
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
                    Categoria
                  </label>
                </div>
                
                <select
                  value={taskModalData.selection}
                  onChange={(e) => setTaskModalData({ ...taskModalData, selection: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="" disabled>Selecione uma categoria</option>
                  <optgroup label="Padrões">
                    <option value="tag:simulado">Simulado</option>
                    <option value="tag:questoes">Questões</option>
                    <option value="tag:revisao">Revisão</option>
                  </optgroup>
                  {materias.length > 0 && (
                    <optgroup label="Suas Matérias">
                      {materias.map(materia => (
                        <option key={materia.id} value={`materia:${materia.id}`}>
                          {materia.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-modal">
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