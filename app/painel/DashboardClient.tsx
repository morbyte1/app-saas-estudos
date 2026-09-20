'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Target, Plus, Check, X, Edit2, Trash2, Library, Play, Flame, RotateCcw, ArrowRight, Sparkles, TrendingUp, TrendingDown, Minus, CalendarDays, Info, CheckCircle2 } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/ToastContext'
import { formatarTempo, type Periodo } from '@/lib/desempenho'
import { formatarDataObjetivo, formatarDiferencaTempo, type DashboardOutput } from '@/lib/dashboard'
import { createTask, updateTask, deleteTask, toggleTaskStatus } from './actions'

type Task = {
  id: string; title: string; materia_id: string | null; tag_padrao: string | null
  priority: 'baixa' | 'normal' | 'alta'; is_done: boolean
}
type Props = { initialTasks: Task[]; initialStats: DashboardOutput & { userName: string } }
const priorityWeight = { alta: 3, normal: 2, baixa: 1 }
const sectionLinkClass = 'inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-primary-700 transition-colors hover:text-primary-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2'
const signedCount = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0'
const subjectStyles = {
  accuracy: { icon: Target, iconClass: 'bg-amber-50 text-amber-700', reasonClass: 'text-amber-800', barClass: 'bg-amber-500' },
  accuracyModerate: { icon: Target, iconClass: 'bg-slate-100 text-slate-600', reasonClass: 'text-slate-600', barClass: 'bg-slate-400' },
  drop: { icon: TrendingDown, iconClass: 'bg-orange-50 text-orange-700', reasonClass: 'text-orange-800', barClass: 'bg-orange-500' },
  rhythm: { icon: Clock, iconClass: 'bg-sky-50 text-sky-700', reasonClass: 'text-sky-800', barClass: 'bg-sky-500' },
  planning: { icon: CalendarDays, iconClass: 'bg-violet-50 text-violet-700', reasonClass: 'text-violet-800', barClass: 'bg-violet-500' },
} as const

export default function DashboardClient({ initialTasks, initialStats: stats }: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [period, setPeriod] = useState<Periodo>('7')
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [isDeletingBlock, setIsDeletingBlock] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskModalData, setTaskModalData] = useState<{ title: string; selection: string; priority: Task['priority'] }>({ title: '', selection: '', priority: 'normal' })
  const { toast } = useToast()
  const materias = stats.materias
  const sortedTasks = [...tasks].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])
  const nextEventId = stats.events.find(e => !e.is_done)?.id
  const periodData = stats.periods[period]
  const step = stats.recommendation
  const firstName = stats.userName.split(' ')[0]
  const examDate = stats.examGoal ? formatarDataObjetivo(stats.examGoal.target_date) : null
  const hasStudyChoice = step.kind === 'maintenance' && step.href === '/painel/timer'

  useEffect(() => {
    const mainElement = document.getElementById('main-scroll-container')
    document.body.classList.toggle('overflow-hidden', isTaskModalOpen)
    mainElement?.classList.toggle('!overflow-hidden', isTaskModalOpen)
    return () => { document.body.classList.remove('overflow-hidden'); mainElement?.classList.remove('!overflow-hidden') }
  }, [isTaskModalOpen])

  const openTaskModal = () => {
    setTaskModalData({ title: '', selection: materias.length ? `materia:${materias[0].id}` : 'tag:simulado', priority: 'normal' })
    setEditingTaskId(null)
    setIsTaskModalOpen(true)
  }
  const closeTaskModal = () => { setIsTaskModalOpen(false); setEditingTaskId(null) }
  const handleSaveTask = async () => {
    if (!taskModalData.title.trim() || !taskModalData.selection) return toast('Preencha o nome e selecione uma categoria.', 'error')
    const materia_id = taskModalData.selection.startsWith('materia:') ? taskModalData.selection.slice(8) : null
    const tag_padrao = taskModalData.selection.startsWith('tag:') ? taskModalData.selection.slice(4) : null
    const data = { title: taskModalData.title.trim(), materia_id, tag_padrao, priority: taskModalData.priority }
    const result = editingTaskId ? await updateTask(editingTaskId, data) : await createTask(data)
    if (result.error) return toast(result.error, 'error')
    if (result.task) setTasks(previous => editingTaskId
      ? previous.map(t => t.id === editingTaskId ? result.task as Task : t)
      : [...previous, result.task as Task])
    closeTaskModal()
  }
  const handleEditTask = (task: Task) => {
    setTaskModalData({ title: task.title, selection: task.materia_id ? `materia:${task.materia_id}` : task.tag_padrao ? `tag:${task.tag_padrao}` : '', priority: task.priority })
    setEditingTaskId(task.id)
    setIsTaskModalOpen(true)
  }
  const executeDeleteTask = async () => {
    if (!taskToDelete) return
    setIsDeletingBlock(true)
    const result = await deleteTask(taskToDelete)
    if (result.success) setTasks(previous => previous.filter(t => t.id !== taskToDelete))
    else toast(result.error || 'Não foi possível excluir a tarefa.', 'error')
    setIsDeletingBlock(false)
    setTaskToDelete(null)
  }
  const handleToggleTask = async (task: Task) => {
    const result = await toggleTaskStatus(task.id, !task.is_done)
    if (result.success) setTasks(previous => previous.map(t => t.id === task.id ? { ...t, is_done: !task.is_done } : t))
    else toast(result.error || 'Não foi possível atualizar a tarefa.', 'error')
  }
  const taskTag = (task: Task) => {
    const labels: Record<string, string> = { simulado: 'Simulado', questoes: 'Questões', revisao: 'Revisão' }
    return task.tag_padrao ? labels[task.tag_padrao] || task.tag_padrao : materias.find(m => m.id === task.materia_id)?.name
  }

  return <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Bom estudo, {firstName}.</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">Veja o que é mais útil fazer agora e acompanhe seu progresso.</p>
        {stats.examGoal && <Link href="/painel/objetivo" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-primary-700">
          <Target className="h-3.5 w-3.5" /> Objetivo: {stats.examGoal.name}{examDate ? ` · ${examDate}` : ''}
        </Link>}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section aria-labelledby="next-step-title" className="relative min-h-[300px] overflow-hidden rounded-3xl bg-primary-900 p-7 text-white shadow-md sm:p-8 lg:col-span-2">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-600 opacity-60 blur-[80px]" />
          <div className="relative max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-primary-200">Seu próximo passo</p>
            <h2 id="next-step-title" className="text-3xl font-extrabold sm:text-4xl">{step.title}</h2>
            {step.subtitle && <p className="mt-1 text-lg font-medium text-primary-100">{step.subtitle}</p>}
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-100/90">{step.reason}</p>
            {(step.duration || step.questions) && <div className="mt-4 flex flex-wrap gap-2">
              {step.duration && <span className="inline-flex items-center gap-2 rounded-lg border border-primary-700/50 bg-primary-800/60 px-3 py-1.5 text-sm font-semibold text-primary-50"><Clock className="h-4 w-4 text-primary-300" />{step.duration} min</span>}
              {step.questions && <span className="rounded-lg border border-primary-700/50 bg-primary-800/60 px-3 py-1.5 text-sm font-semibold text-primary-50">~{step.questions} questões</span>}
            </div>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={step.href} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-primary-900 shadow-sm transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900 sm:w-auto">
                {step.kind === 'review' ? <RotateCcw className="h-4 w-4" /> : step.href.startsWith('/painel/calendario') ? <CalendarDays className="h-4 w-4" /> : <Play className="h-4 w-4" />}{step.cta}
              </Link>
              {hasStudyChoice && <Link href="/painel/calendario" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200/60 bg-primary-800/40 px-6 py-3.5 font-bold text-white transition-colors hover:bg-primary-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900 sm:w-auto">
                <CalendarDays className="h-4 w-4" />Ver calendário
              </Link>}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estudo de hoje</span><Clock className="h-4 w-4 text-primary-600" /></div>
            <p className="mt-2 text-2xl font-extrabold">{formatarTempo(stats.today.seconds)}</p>
            {stats.today.goal !== null && stats.today.goal > 0 ? <>
              <p className="mt-1 text-sm font-medium text-slate-500">{stats.today.progress}% da meta de {stats.today.goal}h</p>
              <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary-600" style={{ width: `${stats.today.progress}%` }} /></div>
            </> : <p className="mt-1 text-sm text-slate-500">{stats.today.goal === 0 ? 'Meta diária definida como 0h' : 'Sem meta diária configurada'}</p>}
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sequência atual</span><Flame className="h-4 w-4 text-orange-500" /></div>
            <p className="mt-2 text-2xl font-extrabold">{stats.streak.current} {stats.streak.current === 1 ? 'dia' : 'dias'}</p>
            <p className="mt-1 text-sm text-slate-500">Melhor sequência: {stats.streak.best} dias</p>
          </div>
          <section className="flex flex-1 flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="day-title">
            <h2 id="day-title" className="font-bold">Seu dia</h2>
            {stats.events.length ? <div className="mt-3 flex-1 space-y-2">{stats.events.map(event => <div key={event.id} className="flex items-start gap-3 text-sm">
              <span className="w-11 shrink-0 font-bold text-slate-700">{event.time.slice(0, 5)}</span>
              <div className="min-w-0 flex-1"><p className={`font-semibold ${event.is_done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{event.title}</p><p className="text-xs text-slate-500">{event.activity_type || 'Estudo'} · {event.duration} min</p></div>
              {event.is_done ? <Check className="h-4 w-4 text-emerald-600" /> : event.id === nextEventId ? <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">Pendente</span> : null}
            </div>)}</div> : <p className="mt-3 flex-1 text-sm text-slate-500">Nada planejado para hoje.</p>}
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3"><Link href="/painel/calendario" className={sectionLinkClass}>Ver calendário <ArrowRight className="h-4 w-4" /></Link></div>
          </section>
        </div>
      </div>

      {stats.insights.length > 0 && <section aria-labelledby="insights-title">
        <h2 id="insights-title" className="mb-4 flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-primary-600" />O Revyza percebeu</h2>
        <div className="grid items-stretch gap-4 md:grid-cols-2">{stats.insights.map(insight => <article key={`${insight.family}:${insight.title}`} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className={`h-fit rounded-xl p-2 ${insight.tone === 'positive' ? 'bg-primary-50 text-primary-700' : insight.tone === 'attention' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            {insight.tone === 'positive' ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : insight.tone === 'attention' ? <TrendingDown className="h-4 w-4" aria-hidden="true" /> : <Info className="h-4 w-4" aria-hidden="true" />}
          </span>
          <div><h3 className="font-bold">{insight.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{insight.message}</p></div>
        </article>)}</div>
      </section>}

      <section aria-labelledby="period-title">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 id="period-title" className="text-lg font-bold">Resumo recente</h2>
          <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:flex sm:w-auto" role="group" aria-label="Período do resumo">{(['7', '14', '30', 'all'] as Periodo[]).map(p => <button key={p} onClick={() => setPeriod(p)} aria-pressed={period === p} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:py-1.5 ${period === p ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}>{p === 'all' ? 'Todo período' : `${p} dias`}</button>)}</div>
        </div>
        <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="flex min-h-36 flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tempo estudado</span>
            <strong className="mt-3 text-2xl text-slate-900">{formatarTempo(periodData.seconds)}</strong>
            {periodData.previous && <span className="mt-auto pt-3 text-xs leading-snug text-slate-500">{formatarDiferencaTempo(periodData.seconds - periodData.previous.seconds)} em relação ao período anterior</span>}
          </div>
          <div className="flex min-h-36 flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Questões</span>
            <strong className="mt-3 text-2xl text-slate-900">{periodData.questions}</strong>
            {periodData.previous && <span className="mt-auto pt-3 text-xs leading-snug text-slate-500">{signedCount(periodData.questions - periodData.previous.questions)} em relação ao período anterior</span>}
          </div>
          <div className="flex min-h-36 flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Precisão</span>
            <strong className="mt-3 text-2xl text-slate-900">{periodData.accuracy === null ? '—' : `${periodData.accuracy}%`}</strong>
            {periodData.previous && <span className={`mt-auto inline-flex items-start gap-1 pt-3 text-xs leading-snug ${periodData.evolution === null ? 'text-slate-500' : periodData.evolution > 0 ? 'text-emerald-700' : periodData.evolution < 0 ? 'text-amber-700' : 'text-slate-600'}`}>
              {periodData.evolution !== null && (periodData.evolution > 0 ? <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" /> : periodData.evolution < 0 ? <TrendingDown className="h-4 w-4 shrink-0" aria-hidden="true" /> : <Minus className="h-4 w-4 shrink-0" aria-hidden="true" />)}
              {periodData.evolution === null ? 'Amostra insuficiente para comparar' : `${periodData.evolution === 0 ? 'Estável · ' : ''}${signedCount(periodData.evolution)} p.p. em relação ao período anterior`}
            </span>}
          </div>
          <div className="flex min-h-36 flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sessões</span>
            <strong className="mt-3 text-2xl text-slate-900">{periodData.sessions}</strong>
            {periodData.previous && <span className="mt-auto pt-3 text-xs leading-snug text-slate-500">{signedCount(periodData.sessions - periodData.previous.sessions)} em relação ao período anterior</span>}
          </div>
        </div>
        <div className="mt-4 flex justify-end border-t border-slate-200/70 pt-3"><Link href={`/painel/estatisticas?periodo=${period}`} className={sectionLinkClass}>Ver análise completa <ArrowRight className="h-4 w-4" /></Link></div>
      </section>

      {stats.subjects.length > 0 && <section aria-labelledby="subjects-title">
        <h2 id="subjects-title" className="mb-4 text-lg font-bold">Matérias para acompanhar</h2>
        <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">{stats.subjects.map(subject => {
          const style = subjectStyles[subject.signal]
          const SignalIcon = style.icon
          return <Link key={subject.id} href={`/painel/materias/${encodeURIComponent(subject.id)}`} className="group flex h-full min-h-40 flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-primary-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2">
            <div className="flex items-start gap-3">
              <span className={`rounded-xl p-2 ${style.iconClass}`}><SignalIcon className="h-4 w-4" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{subject.name}</h3><p className={`mt-1 text-xs font-semibold ${style.reasonClass}`}>{subject.priority}</p></div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-700" aria-hidden="true" />
            </div>
            {subject.progress !== null && <div className="mt-auto pt-5">
              <div className="flex items-baseline justify-between gap-2 text-xs"><span className="font-medium text-slate-500">Meta semanal</span><span className="font-bold text-slate-700">{subject.progress}%</span></div>
              <div role="progressbar" aria-label={`Meta semanal de ${subject.name}`} aria-valuenow={subject.progress} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${style.barClass}`} style={{ width: `${subject.progress}%` }} /></div>
              <p className="mt-2 text-xs text-slate-500">{formatarTempo(subject.weeklyStudiedSeconds)} de {subject.weeklyGoal}h planejadas</p>
            </div>}
          </Link>
        })}</div>
        <div className="mt-4 flex justify-end border-t border-slate-200/70 pt-3"><Link href="/painel/materias" className={sectionLinkClass}>Ver todas as matérias <ArrowRight className="h-4 w-4" /></Link></div>
      </section>}

      <section aria-labelledby="tasks-title" className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between"><h2 id="tasks-title" className="text-lg font-bold">Tarefas manuais</h2><button onClick={openTaskModal} aria-label="Adicionar tarefa" className="rounded-lg bg-primary-50 p-2 text-primary-600 hover:bg-primary-100"><Plus className="h-4 w-4" /></button></div>
        {sortedTasks.length ? <div className="grid gap-3 md:grid-cols-2">{sortedTasks.map(task => <div key={task.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
          <button onClick={() => handleToggleTask(task)} aria-label={task.is_done ? 'Marcar como pendente' : 'Concluir tarefa'} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${task.is_done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>{task.is_done && <Check className="h-3 w-3" />}</button>
          <div className="min-w-0 flex-1"><p className={`break-words text-sm font-medium ${task.is_done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</p>{taskTag(task) && <span className="mt-1 inline-block rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">{taskTag(task)}</span>}</div>
          <button onClick={() => handleEditTask(task)} aria-label="Editar tarefa" className="p-1 text-slate-400 hover:text-primary-600"><Edit2 className="h-4 w-4" /></button>
          <button onClick={() => setTaskToDelete(task.id)} aria-label="Excluir tarefa" className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>)}</div> : <p className="flex items-center gap-2 text-sm text-slate-500"><Library className="h-4 w-4" />Nenhuma tarefa manual pendente.</p>}
      </section>
    </div>

    {isTaskModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
      <div className="mb-6 flex items-center justify-between"><h3 className="text-xl font-bold">{editingTaskId ? 'Editar tarefa' : 'Nova tarefa'}</h3><button onClick={closeTaskModal} aria-label="Fechar" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
      <div className="space-y-4">
        <label className="block text-sm font-medium">O que precisa ser feito?<input value={taskModalData.title} onChange={e => setTaskModalData({ ...taskModalData, title: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2" /></label>
        <label className="block text-sm font-medium">Prioridade<select value={taskModalData.priority} onChange={e => setTaskModalData({ ...taskModalData, priority: e.target.value as Task['priority'] })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2"><option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option></select></label>
        <label className="block text-sm font-medium">Categoria<select value={taskModalData.selection} onChange={e => setTaskModalData({ ...taskModalData, selection: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2"><option value="" disabled>Selecione uma categoria</option><optgroup label="Padrões"><option value="tag:simulado">Simulado</option><option value="tag:questoes">Questões</option><option value="tag:revisao">Revisão</option></optgroup>{materias.length > 0 && <optgroup label="Suas matérias">{materias.map(m => <option key={m.id} value={`materia:${m.id}`}>{m.name}</option>)}</optgroup>}</select></label>
      </div>
      <div className="mt-6 flex gap-3"><button onClick={closeTaskModal} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-medium">Cancelar</button><button onClick={handleSaveTask} className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 font-medium text-white">Salvar</button></div>
    </div></div>}
    <ConfirmModal isOpen={!!taskToDelete} title="Excluir tarefa" message="Tem certeza de que deseja excluir esta tarefa?" confirmText="Sim, excluir" onConfirm={executeDeleteTask} onCancel={() => setTaskToDelete(null)} isLoading={isDeletingBlock} />
  </div>
}
