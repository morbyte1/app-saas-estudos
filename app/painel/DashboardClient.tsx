'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Target, Plus, Check, X, Edit2, Trash2, Library, Play, Flame, RotateCcw, ArrowRight, Sparkles } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/ToastContext'
import { formatarTempo, type Periodo } from '@/lib/desempenho'
import type { DashboardOutput } from '@/lib/dashboard'
import { createTask, updateTask, deleteTask, toggleTaskStatus } from './actions'

type Task = {
  id: string; title: string; materia_id: string | null; tag_padrao: string | null
  priority: 'baixa' | 'normal' | 'alta'; is_done: boolean
}
type Props = { initialTasks: Task[]; initialStats: DashboardOutput & { userName: string } }
const priorityWeight = { alta: 3, normal: 2, baixa: 1 }

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
          <Target className="h-3.5 w-3.5" /> Objetivo: {stats.examGoal.name} · {stats.examGoal.target_date.split('-').reverse().join('/')}
        </Link>}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section aria-labelledby="next-step-title" className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-3xl bg-primary-900 p-7 text-white shadow-md sm:p-8 lg:col-span-2">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-600 opacity-60 blur-[80px]" />
          <div className="relative">
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-primary-200">Seu próximo passo</p>
            <h2 id="next-step-title" className="text-3xl font-extrabold sm:text-4xl">{step.title}</h2>
            {step.subtitle && <p className="mt-1 text-lg font-medium text-primary-100">{step.subtitle}</p>}
            {(step.duration || step.questions) && <div className="mt-5 flex flex-wrap gap-2">
              {step.duration && <span className="inline-flex items-center gap-2 rounded-lg border border-primary-700/50 bg-primary-800/60 px-3 py-1.5 text-sm font-semibold text-primary-50"><Clock className="h-4 w-4 text-primary-300" />{step.duration} min</span>}
              {step.questions && <span className="rounded-lg border border-primary-700/50 bg-primary-800/60 px-3 py-1.5 text-sm font-semibold text-primary-50">~{step.questions} questões</span>}
            </div>}
            <p className="mb-6 mt-5 max-w-xl text-sm leading-relaxed text-primary-100/90">{step.reason}</p>
            {stats.maturity === 'learning' && <p className="mb-5 text-xs font-semibold text-primary-200">Estamos conhecendo seu ritmo; tendências só aparecem com dados suficientes.</p>}
          </div>
          <Link href={step.href} className="relative inline-flex w-max items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-primary-900 shadow-sm transition-colors hover:bg-primary-50">
            {step.kind === 'review' ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}{step.cta}
          </Link>
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
          <section className="flex-1 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="day-title">
            <div className="flex items-center justify-between gap-3"><h2 id="day-title" className="font-bold">Seu dia</h2><Link href="/painel/calendario" className="text-xs font-semibold text-primary-700 hover:underline">Ver Calendário</Link></div>
            {stats.events.length ? <div className="mt-3 space-y-2">{stats.events.map(event => <div key={event.id} className="flex items-start gap-3 text-sm">
              <span className="w-11 shrink-0 font-bold text-slate-700">{event.time.slice(0, 5)}</span>
              <div className="min-w-0 flex-1"><p className={`font-semibold ${event.is_done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{event.title}</p><p className="text-xs text-slate-500">{event.activity_type || 'Estudo'} · {event.duration} min</p></div>
              {event.is_done ? <Check className="h-4 w-4 text-emerald-600" /> : event.id === nextEventId ? <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">Pendente</span> : null}
            </div>)}</div> : <p className="mt-3 text-sm text-slate-500">Nada planejado para hoje.</p>}
          </section>
        </div>
      </div>

      {stats.insights.length > 0 && <section aria-labelledby="insights-title">
        <h2 id="insights-title" className="mb-4 flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-primary-600" />O Revyza percebeu</h2>
        <div className="grid gap-4 md:grid-cols-2">{stats.insights.map(insight => <article key={`${insight.family}:${insight.title}`} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold">{insight.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{insight.message}</p>
        </article>)}</div>
      </section>}

      <section aria-labelledby="period-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 id="period-title" className="text-lg font-bold">Resumo recente</h2>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">{(['7', '14', '30', 'all'] as Periodo[]).map(p => <button key={p} onClick={() => setPeriod(p)} aria-pressed={period === p} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${period === p ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}>{p === 'all' ? 'Todo período' : `${p} dias`}</button>)}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Tempo estudado', value: formatarTempo(periodData.seconds) },
            { label: 'Questões', value: String(periodData.questions) },
            { label: 'Precisão', value: periodData.accuracy === null ? '—' : `${periodData.accuracy}%`, note: periodData.questions > 0 && periodData.questions < 20 ? 'Amostra pequena' : undefined },
            { label: 'Evolução', value: periodData.evolution === null ? '—' : `${periodData.evolution > 0 ? '+' : ''}${periodData.evolution} p.p.`, note: period === 'all' ? 'Sem comparação' : periodData.evolution === null ? 'Exige 20 questões em cada período' : 'vs. período anterior' },
          ].map(item => <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><span className="block text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</span><strong className="mt-2 block text-2xl text-slate-900">{item.value}</strong>{item.note && <span className="mt-1 block text-xs text-slate-500">{item.note}</span>}</div>)}
        </div>
        <Link href={`/painel/estatisticas?periodo=${period}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline">Ver análise completa <ArrowRight className="h-4 w-4" /></Link>
      </section>

      {stats.subjects.length > 0 && <section aria-labelledby="subjects-title">
        <div className="mb-4 flex items-center justify-between"><h2 id="subjects-title" className="text-lg font-bold">Matérias para acompanhar</h2><Link href="/painel/materias" className="text-sm font-semibold text-primary-700 hover:underline">Todas as matérias</Link></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{stats.subjects.map(subject => <div key={subject.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><h3 className="font-bold">{subject.name}</h3><span className="rounded-md bg-primary-50 px-2 py-1 text-[10px] font-bold text-primary-700">{subject.priority}</span></div>
          <p className="mt-2 text-xs text-slate-500">{formatarTempo(subject.weeklyStudiedSeconds)} de {subject.weeklyGoal}h semanais</p>
          {subject.progress !== null && <div className="mt-3 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-primary-600" style={{ width: `${subject.progress}%` }} /></div>}
        </div>)}</div>
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
