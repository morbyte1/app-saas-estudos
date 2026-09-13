'use client'

import { useState, useTransition } from 'react'
import { useToast } from '@/components/ToastContext'
import { Target, ArrowRight, GraduationCap, Compass, CheckCircle2, ChevronRight, Edit2, Check, Clock } from 'lucide-react'
import { 
  saveOnboardingComplete, 
  updateCursoDesejado, 
  updateNivelMateria, 
  updateExamGoalTarget 
} from './actions'

interface Materia {
  id: string
  name: string
}

interface ObjetivoClientProps {
  initialData: {
    examGoal: { name: string; target_date: string } | null
    context: { curso_desejado: string | null; nivel_percebido: Record<string, string>; onboarding_completo: boolean } | null
    materias: Materia[]
  }
}

export default function ObjetivoClient({ initialData }: ObjetivoClientProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const isComplete = initialData.context?.onboarding_completo || false
  const [step, setStep] = useState(isComplete ? 0 : 1)
  
  // Estados do Formulário de Onboarding
  const [examType, setExamType] = useState<'ENEM' | 'OUTRO' | null>(null)
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [curso, setCurso] = useState(initialData.context?.curso_desejado || '')
  const [niveis, setNiveis] = useState<Record<string, string>>(initialData.context?.nivel_percebido || {})

  // Estados de Edição da Visão Padrão
  const [isEditingCourse, setIsEditingCourse] = useState(false)
  const [isEditingExam, setIsEditingExam] = useState(false)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)

  const handleNextStep1 = () => {
    if (examType === 'OUTRO' && (!examName.trim() || !examDate)) {
      return toast('Preencha o nome e a data do vestibular.', 'error')
    }
    setStep(2)
  }

  const handleCompleteOnboarding = () => {
    const finalExamName = examType === 'ENEM' ? 'ENEM 2026' : examName
    const finalExamDate = examType === 'ENEM' ? '2026-11-08T13:00:00Z' : new Date(examDate + 'T12:00:00Z').toISOString()

    startTransition(async () => {
      const result = await saveOnboardingComplete({
        examName: finalExamName,
        examDate: finalExamDate,
        curso,
        niveis
      })

      if (result.success) {
        toast('Contexto de objetivo salvo com sucesso!', 'success')
        setStep(0)
      } else {
        toast('Erro ao salvar suas configurações.', 'error')
      }
    })
  }

  const handleSaveCourse = () => {
    startTransition(async () => {
      const result = await updateCursoDesejado(curso)
      if (result.success) {
        setIsEditingCourse(false)
        toast('Curso atualizado.', 'success')
      }
    })
  }

  const handleSaveExam = () => {
    if (examType === 'OUTRO' && (!examName.trim() || !examDate)) {
      return toast('Preencha os dados do vestibular.', 'error')
    }
    const finalName = examType === 'ENEM' ? 'ENEM 2026' : examName
    const finalDate = examType === 'ENEM' ? '2026-11-08T13:00:00Z' : new Date(examDate + 'T12:00:00Z').toISOString()

    startTransition(async () => {
      const result = await updateExamGoalTarget(finalName, finalDate)
      if (result.success) {
        setIsEditingExam(false)
        toast('Alvo atualizado.', 'success')
        window.location.reload()
      }
    })
  }

  const handleUpdateLevelInline = (materiaId: string, level: string) => {
    setNiveis(prev => ({ ...prev, [materiaId]: level }))
    startTransition(async () => {
      const result = await updateNivelMateria(materiaId, level)
      if (result.success) setEditingSubjectId(null)
      else toast('Erro ao atualizar nível.', 'error')
    })
  }

  const calculateDaysRemaining = (targetStr: string | null) => {
    if (!targetStr) return null
    const target = new Date(targetStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return diff > 0 ? diff : 0
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <Target className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Qual é o seu alvo principal?</h1>
            <p className="text-slate-500 mt-2 font-medium">Precisamos dessa informação para guiar seu ritmo diário e saber se você está no tempo certo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setExamType('ENEM')}
              className={`p-6 rounded-3xl border-2 text-left transition-all ${examType === 'ENEM' ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-500/10' : 'border-slate-200 bg-white hover:border-primary-300'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${examType === 'ENEM' ? 'text-primary-700' : 'text-slate-900'}`}>ENEM</h3>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${examType === 'ENEM' ? 'border-primary-600 bg-primary-600' : 'border-slate-300'}`}>
                  {examType === 'ENEM' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500">A trilha oficial para o Exame Nacional do Ensino Médio 2026.</p>
            </button>
            <button
              onClick={() => setExamType('OUTRO')}
              className={`p-6 rounded-3xl border-2 text-left transition-all ${examType === 'OUTRO' ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-500/10' : 'border-slate-200 bg-white hover:border-primary-300'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${examType === 'OUTRO' ? 'text-primary-700' : 'text-slate-900'}`}>Outro Vestibular</h3>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${examType === 'OUTRO' ? 'border-primary-600 bg-primary-600' : 'border-slate-300'}`}>
                  {examType === 'OUTRO' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500">Concursos militares, vestibulares regionais ou carreiras específicas.</p>
            </button>
          </div>

          {examType === 'OUTRO' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 mb-8 animate-in slide-in-from-top-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider text-xs">Nome da Prova</label>
                <input type="text" value={examName} onChange={e => setExamName(e.target.value)} placeholder="Ex: Fuvest 2026" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider text-xs">Data Oficial</label>
                <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleNextStep1} disabled={!examType} className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-sm disabled:opacity-50">
              Continuar <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full">
          <div className="text-center mb-10">
            <GraduationCap className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Que curso você quer fazer?</h1>
            <p className="text-slate-500 mt-2 font-medium">Pode ser específico ou uma área geral. É só pra não perdermos o horizonte.</p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-8">
            <input 
              type="text" 
              value={curso} 
              onChange={e => setCurso(e.target.value)} 
              placeholder="Ex: Medicina na USP, Engenharia, Direito..." 
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-primary-500 text-center" 
              autoFocus
              onKeyDown={e => e.key === 'Enter' && setStep(3)}
            />
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-between gap-4">
            <button onClick={() => setStep(3)} className="px-6 py-3.5 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition">
              Pular esta etapa
            </button>
            <button onClick={() => setStep(3)} className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-sm">
              Continuar <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center py-12">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-10">
            <Compass className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Onde você está hoje?</h1>
            <p className="text-slate-500 mt-2 font-medium">Seja honesto consigo mesmo. Identificar sua base agora ajuda na distribuição de tempo no futuro.</p>
          </div>

          {initialData.materias.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center mb-8">
              <p className="text-slate-600 font-medium mb-2">Você ainda não possui matérias cadastradas.</p>
              <p className="text-sm text-slate-400">Pule esta etapa por enquanto, você poderá preencher depois que configurar suas matérias no sistema.</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 space-y-4">
              {initialData.materias.map(m => (
                <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                  <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 w-full md:w-auto">
                    {['iniciante', 'intermediario', 'avancado'].map(nivel => (
                      <button
                        key={nivel}
                        onClick={() => setNiveis(prev => ({ ...prev, [m.id]: nivel }))}
                        className={`flex-1 md:w-28 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                          niveis[m.id] === nivel 
                            ? 'bg-white text-primary-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {nivel === 'intermediario' ? 'Interm.' : nivel}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button 
              onClick={handleCompleteOnboarding} 
              disabled={isPending}
              className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-sm disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : 'Finalizar Configuração'} <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // DEFAULT VIEW (Step 0)
  const currentExamName = initialData.examGoal?.name || 'Não definido'
  const currentExamDate = initialData.examGoal?.target_date || null
  const daysRemaining = calculateDaysRemaining(currentExamDate)

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABEÇALHO */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Seu Objetivo</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">O contexto que norteia a urgência dos seus estudos diários.</p>
        </div>

        {/* CONTADOR HERÓI */}
        <div className="bg-primary-900 text-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600 opacity-60 rounded-full blur-[80px] pointer-events-none translate-x-1/4 -translate-y-1/4"></div>
          
          <div className="text-center md:text-left relative z-10">
            <p className="text-primary-200 font-bold uppercase tracking-wider text-xs mb-3">{currentExamName}</p>
            {daysRemaining !== null ? (
              <>
                <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
                  {daysRemaining === 0 ? 'Chegou o dia!' : `${daysRemaining} dias`}
                </h2>
                {daysRemaining > 0 && <p className="text-primary-100 font-medium mt-3 text-lg">restantes para a prova</p>}
              </>
            ) : (
              <h2 className="text-3xl md:text-4xl font-extrabold">Data não definida</h2>
            )}
          </div>
          
          <div className="relative z-10 shrink-0 w-full md:w-auto">
            {isEditingExam ? (
              <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/20 w-full md:w-80 space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setExamType('ENEM')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${examType === 'ENEM' ? 'bg-white text-primary-900' : 'bg-transparent text-primary-200 border border-white/20 hover:bg-white/5'}`}>ENEM</button>
                  <button onClick={() => setExamType('OUTRO')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${examType === 'OUTRO' ? 'bg-white text-primary-900' : 'bg-transparent text-primary-200 border border-white/20 hover:bg-white/5'}`}>OUTRO</button>
                </div>
                {examType === 'OUTRO' && (
                  <>
                    <input type="text" value={examName} onChange={e => setExamName(e.target.value)} placeholder="Nome" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder:text-primary-200 focus:outline-none focus:border-white" />
                    <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder:text-primary-200 focus:outline-none focus:border-white" />
                  </>
                )}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setIsEditingExam(false)} className="flex-1 py-2 text-xs font-bold text-primary-200 hover:text-white transition">Cancelar</button>
                  <button onClick={handleSaveExam} disabled={isPending} className="flex-1 py-2 bg-white text-primary-900 font-bold rounded-lg hover:bg-primary-50 transition">Salvar</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setIsEditingExam(true)
                  setExamType(currentExamName.includes('ENEM') ? 'ENEM' : 'OUTRO')
                  setExamName(currentExamName)
                  setExamDate(currentExamDate ? currentExamDate.substring(0, 10) : '')
                }}
                className="w-full md:w-auto bg-white/10 hover:bg-white/20 border border-white/10 text-white px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Editar alvo
              </button>
            )}
          </div>
        </div>

        {/* GRID INFERIOR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CURSO */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-start justify-center min-h-[160px]">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2 mb-3"><GraduationCap className="w-4 h-4" /> Curso Desejado</span>
            {isEditingCourse ? (
              <div className="w-full flex items-center gap-2">
                <input 
                  type="text" 
                  value={curso} 
                  onChange={e => setCurso(e.target.value)} 
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500" 
                  autoFocus 
                  onKeyDown={e => e.key === 'Enter' && handleSaveCourse()}
                />
                <button onClick={handleSaveCourse} disabled={isPending} className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition">
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between group">
                <h3 className="text-2xl font-extrabold text-slate-900 break-words">{curso || <span className="text-slate-300 italic font-medium text-lg">Ainda não definido</span>}</h3>
                <button onClick={() => setIsEditingCourse(true)} className="p-2 text-slate-400 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 rounded-xl transition opacity-0 group-hover:opacity-100">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* MATÉRIAS E NÍVEIS */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Compass className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-slate-900">Meu perfil por disciplina</h3>
            </div>

            {initialData.materias.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-slate-500 text-sm font-medium">Nenhuma matéria para avaliar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {initialData.materias.map(m => {
                  const nivelAtual = niveis[m.id]
                  const isEditing = editingSubjectId === m.id

                  return (
                    <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 border border-transparent hover:border-slate-100 hover:bg-slate-50 rounded-xl transition-all gap-3">
                      <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                      
                      {isEditing ? (
                        <div className="flex bg-slate-200/60 p-1 rounded-xl shrink-0 w-full md:w-auto">
                          {['iniciante', 'intermediario', 'avancado'].map(nivel => (
                            <button
                              key={nivel}
                              onClick={() => handleUpdateLevelInline(m.id, nivel)}
                              disabled={isPending}
                              className={`flex-1 md:w-24 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                                niveis[m.id] === nivel 
                                  ? 'bg-white text-primary-700 shadow-sm' 
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {nivel === 'intermediario' ? 'Interm.' : nivel}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                          {nivelAtual ? (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                              nivelAtual === 'iniciante' ? 'bg-orange-100 text-orange-700' :
                              nivelAtual === 'intermediario' ? 'bg-blue-100 text-blue-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {nivelAtual === 'intermediario' ? 'Intermediário' : nivelAtual}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-500">Pendente</span>
                          )}
                          <button onClick={() => setEditingSubjectId(m.id)} className="text-[11px] font-bold text-primary-600 hover:text-primary-700 uppercase">
                            Reavaliar
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}