'use client'

import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ConfirmModal'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Target, TrendingUp, TrendingDown, Plus, Check, X, Edit2, Trash2, Library, ChevronRight, HelpCircle, AlertTriangle, Play, CheckCircle, Flame, BarChart2 } from 'lucide-react'
import { useToast } from '@/components/ToastContext'
import { getTasks, createTask, updateTask, deleteTask, toggleTaskStatus } from './actions'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type PeriodKey = '7' | '14' | '30' | 'all'

export default function DashboardClient({ initialEvents, initialTasks, initialStats, initialMaterias }: any) {
  const [events, setEvents] = useState(initialEvents)
  const [materias, setMaterias] = useState(initialMaterias)
  const [tasks, setTasks] = useState(initialTasks)
  const [stats, setStats] = useState(initialStats)
  const [period, setPeriod] = useState<PeriodKey>('7')
  const { toast } = useToast()
  
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [isDeletingBlock, setIsDeletingBlock] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskModalData, setTaskModalData] = useState<{title: string; selection: string; priority: 'baixa' | 'normal' | 'alta';}>({title: '', selection: '', priority: 'normal'})

  useEffect(() => {
    const mainElement = document.getElementById('main-scroll-container')
    if (isTaskModalOpen) {
      document.body.classList.add('overflow-hidden')
      mainElement?.classList.add('!overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
      mainElement?.classList.remove('!overflow-hidden')
    }
  }, [isTaskModalOpen])

  // Helpers de Data para o Calendário
  const today = new Date()
  today.setHours(today.getHours() - 3) // BRT adjustment fallback
  const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const todaysEvents = events
    .filter((e: any) => e.event_date && e.event_date.startsWith(dateString))
    .sort((a: any, b: any) => a.time.localeCompare(b.time))

  let foundNext = false
  const eventsWithStatus = todaysEvents.map((event: any) => {
    let status = ''
    if (event.is_done) status = 'Feito'
    else if (!foundNext) { status = 'Próxima'; foundNext = true } 
    else status = 'Depois'
    return { ...event, status }
  })

  const priorityWeight = { alta: 3, normal: 2, baixa: 1 }
  const sortedTasks = [...tasks].sort((a, b) => priorityWeight[b.priority as keyof typeof priorityWeight] - priorityWeight[a.priority as keyof typeof priorityWeight])

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
      if (result.success && result.task) { setTasks(tasks.map((t: any) => t.id === editingTaskId ? result.task : t)); closeTaskModal() }
    } else {
      const result = await createTask({ title: taskModalData.title, materia_id, tag_padrao, priority: taskModalData.priority })
      if (result.success && result.task) { setTasks([...tasks, result.task]); closeTaskModal() }
    }
  }

  const handleEditTask = (task: any) => {
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
    if(result.success) setTasks(tasks.filter((t: any) => t.id !== taskToDelete))
    setIsDeletingBlock(false)
    setTaskToDelete(null)
  }

  const handleToggleTask = async (id: string, currentStatus: boolean) => {
    const result = await toggleTaskStatus(id, !currentStatus)
    if(result.success) setTasks(tasks.map((t: any) => t.id === id ? { ...t, is_done: !currentStatus } : t))
  }

const renderTaskTag = (task: any) => {
    const TAGS_PADRAO: Record<string, { name: string; colorClass: string }> = {
      simulado: { name: 'Simulado', colorClass: 'text-purple-600 bg-purple-100' },
      questoes: { name: 'Questões', colorClass: 'text-orange-600 bg-orange-100' },
      revisao: { name: 'Revisão', colorClass: 'text-blue-600 bg-blue-100' }
    }

    if (task.tag_padrao) {
      const config = TAGS_PADRAO[task.tag_padrao]
      if (config) return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${config.colorClass}`}>{config.name}</span>
    } else if (task.materia_id) {
      const mat = materias.find((m: any) => m.id === task.materia_id)
      if (mat) return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary-100 text-primary-700">{mat.name}</span>
    }
    return null
  }

  if (!stats) return <div className="p-8">Carregando dados...</div>

  const firstName = stats.userName.split(' ')[0]
  const currentStats = stats.current
  const periodData = stats.periods[period]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bom estudo, {firstName}.</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Veja o que fazer agora e acompanhe seu histórico.</p>
        </div>

        {/* SECTION 1: ESTADO ATUAL (Recomendação + Hoje/Streak) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-primary-900 rounded-3xl p-8 shadow-md text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-600 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
            <div>
              <p className="text-primary-200 font-bold uppercase tracking-widest text-xs mb-5">Seu Próximo Estudo</p>
              {currentStats.recommendation ? (
                <>
                  <h2 className="text-3xl sm:text-4xl font-extrabold mb-1">{currentStats.recommendation.subject}</h2>
                  <h3 className="text-lg text-primary-100 font-medium mb-6">{currentStats.recommendation.topic}</h3>
                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-2 bg-primary-800/60 px-3 py-1.5 rounded-lg border border-primary-700/50">
                      <Clock className="w-4 h-4 text-primary-300" />
                      <span className="text-sm font-semibold text-primary-50">Estude por {currentStats.recommendation.duration} min</span>
                    </div>
                  </div>
                  <p className="text-primary-100/90 text-sm max-w-xl leading-relaxed mb-6">
                    {currentStats.recommendation.reason}
                  </p>
                </>
              ) : (
                <div className="py-6">
                  <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Configuração necessária</h2>
                  <p className="text-primary-100 text-lg">Adicione suas matérias para receber recomendações personalizadas baseadas no seu histórico.</p>
                </div>
              )}
            </div>
            <div>
              <Link href={currentStats.recommendation?.actionUrl || '/dashboard/materias'} className="inline-flex items-center gap-2 bg-white text-primary-900 px-6 py-3.5 rounded-xl font-bold hover:bg-primary-50 transition-colors shadow-sm w-max">
                <Play className="w-4 h-4 fill-current" />
                {currentStats.recommendation ? 'Começar estudo' : 'Ir para Matérias'}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hoje</span>
                <Clock className="w-4 h-4 text-primary-600" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">{currentStats.today.timeFormatted}</h3>
              {currentStats.today.goal > 0 ? (
                <>
                  <p className="text-sm font-medium text-slate-500 mb-3">{currentStats.today.progress}% da meta de {currentStats.today.goal}h</p>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${currentStats.today.progress}%` }}></div>
                  </div>
                </>
              ) : (
                <p className="text-sm font-medium text-slate-500">Sem meta diária configurada</p>
              )}
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sequência atual</span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              {currentStats.streak.current > 0 ? (
                <h3 className="text-2xl font-extrabold text-slate-900">{currentStats.streak.current} {currentStats.streak.current === 1 ? 'dia' : 'dias'}</h3>
              ) : (
                <h3 className="text-xl font-extrabold text-slate-400">—</h3>
              )}
              <p className="text-sm font-medium text-slate-500 mt-1">Melhor sequência: {currentStats.streak.best} dias</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: ANÁLISE DO PERÍODO */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-bold text-slate-900">Análise do Período</h2>
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
              {(['7', '14', '30', 'all'] as PeriodKey[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${period === p ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {p === 'all' ? 'Todo Período' : `${p} dias`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Tempo Estudado</span>
              <span className="text-2xl font-extrabold text-slate-900">{periodData.timeFormatted}</span>
            </div>
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Questões Respondidas</span>
              <span className="text-2xl font-extrabold text-slate-900">{periodData.questions}</span>
            </div>
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Precisão</span>
              <span className="text-2xl font-extrabold text-slate-900">{periodData.accuracy !== null ? `${periodData.accuracy}%` : '—'}</span>
            </div>
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Evolução</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-extrabold ${periodData.evolutionLabel === 'Novo' || periodData.evolutionLabel === '—' ? 'text-slate-400 text-xl' : 'text-slate-900'}`}>
                  {periodData.evolutionLabel}
                </span>
                {periodData.evolutionLabel.includes('+') && <TrendingUp className="w-5 h-5 text-emerald-500" />}
                {periodData.evolutionLabel.includes('-') && !periodData.evolutionLabel.includes('—') && <TrendingDown className="w-5 h-5 text-red-500" />}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">vs. período anterior</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Atividade Visual (Horas)</h3>
            <div className="h-48 w-full">
              {periodData.activityChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodData.activityChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="#71c385" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">Sem dados no período.</div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: DIAGNÓSTICO (Atenção) */}
        {currentStats.diagnostics.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Onde você precisa de atenção</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentStats.diagnostics.map((diag: any, i: number) => (
                <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-start gap-4">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    diag.type === 'erros' ? 'bg-red-100 text-red-600' : 
                    diag.type === 'desempenho' ? 'bg-orange-100 text-orange-600' : 
                    'bg-amber-100 text-amber-600'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{diag.subject}</h3>
                    <p className="text-slate-500 text-sm mt-1 leading-snug font-medium">{diag.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: MATÉRIAS */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Acompanhamento por Matéria</h2>
            <Link href="/dashboard/materias" className="text-primary-600 text-sm font-semibold hover:text-primary-700">Configurar</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.subjects.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                <Library className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">Nenhuma matéria para acompanhar.</p>
              </div>
            ) : (
              stats.subjects.map((sub: any) => (
                <div key={sub.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{sub.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{sub.weeklyGoal}h semanais</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      sub.statusId === 'no_ritmo' ? 'bg-emerald-100 text-emerald-700' :
                      sub.statusId === 'abaixo_do_ritmo' ? 'bg-amber-100 text-amber-700' :
                      sub.statusId === 'atrasado' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {sub.statusId.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  {sub.statusId === 'nao_iniciada' ? (
                    <div className="py-4 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <span className="text-xs font-medium text-slate-500">Não iniciada</span>
                    </div>
                  ) : sub.statusId === 'sem_dados' ? (
                    <div className="py-4 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <span className="text-xs font-medium text-slate-500">Sem estudo neste período</span>
                    </div>
                  ) : (
                    <div>
                      {sub.missingHours > 0 ? (
                        <div className="bg-slate-50 p-3 rounded-xl mb-4">
                          <p className="text-xs text-slate-700 font-medium mb-1">
                            Faltam <strong className="text-slate-900">{sub.missingHours.toFixed(1)}h</strong> • Restam {sub.daysRemainingWeek} dias
                          </p>
                          <p className="text-xs text-primary-700 font-bold">Ritmo: {sub.requiredPacePerDay.toFixed(1)}h / dia</p>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 p-3 rounded-xl mb-4 text-center">
                          <p className="text-xs text-emerald-700 font-bold">Meta semanal alcançada!</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="text-xs text-slate-500 font-medium">Estudado: <strong className="text-slate-900">{sub.weeklyStudiedFormatted}</strong></div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Target className="w-3.5 h-3.5 text-slate-400" />
                          {sub.accuracy !== null ? `${sub.accuracy}% prec` : '—'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 5: PLANEJADO E TAREFAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Planejado para hoje</h2>
              <Link href="/dashboard/calendario" className="text-sm text-primary-600 font-semibold hover:text-primary-700">Ver Agenda</Link>
            </div>
            <div className="flex flex-col gap-3">
              {eventsWithStatus.length === 0 ? (
                <p className="text-center text-slate-500 py-4 text-sm font-medium border border-dashed border-slate-200 rounded-xl">Sem planejamento no calendário hoje.</p>
              ) : (
                eventsWithStatus.map((event: any) => (
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

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Tarefas Manuais</h2>
              <button onClick={openTaskModal} className="bg-primary-50 text-primary-600 p-2 rounded-lg hover:bg-primary-100 transition"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {sortedTasks.length === 0 ? (
                <p className="text-center text-slate-500 py-4 text-sm border border-dashed border-slate-200 rounded-xl">Nenhuma tarefa pendente.</p>
              ) : (
                sortedTasks.map((task: any) => (
                  <div key={task.id} className="flex items-start gap-3 border border-slate-100 rounded-xl p-3 group relative hover:border-slate-200 transition">
                    <div onClick={() => handleToggleTask(task.id, task.is_done)} className={`w-5 h-5 border-2 rounded flex-shrink-0 cursor-pointer flex items-center justify-center mt-0.5 ${task.is_done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                      {task.is_done && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0 pr-12">
                      <p className={`font-medium break-words leading-snug text-sm ${task.is_done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">{renderTaskTag(task)}</div>
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
                <input type="text" value={taskModalData.title} onChange={(e) => setTaskModalData({ ...taskModalData, title: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Prioridade</label>
                <select value={taskModalData.priority} onChange={(e) => setTaskModalData({ ...taskModalData, priority: e.target.value as any })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white">
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                <select value={taskModalData.selection} onChange={(e) => setTaskModalData({ ...taskModalData, selection: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white">
                  <option value="" disabled>Selecione uma categoria</option>
                  <optgroup label="Padrões">
                    <option value="tag:simulado">Simulado</option>
                    <option value="tag:questoes">Questões</option>
                    <option value="tag:revisao">Revisão</option>
                  </optgroup>
                  {materias.length > 0 && (
                    <optgroup label="Suas Matérias">
                      {materias.map((m: any) => <option key={m.id} value={`materia:${m.id}`}>{m.name}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeTaskModal} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition">Cancelar</button>
              <button onClick={handleSaveTask} className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition">Salvar</button>
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
    </div>
  )
}