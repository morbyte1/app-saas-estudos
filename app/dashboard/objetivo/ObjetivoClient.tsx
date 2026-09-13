'use client'

/* 
  Regra Futura (Nível Automático):
  Quando uma matéria atingir um piso mínimo de questões respondidas (a definir, sugestão inicial: 15–20), 
  o nível dessa matéria passa a ser calculado automaticamente a partir da precisão registrada, 
  substituindo a autoavaliação. Nesse estado, a matéria exibe a etiqueta "Com base no seu desempenho" 
  em vez de "Autoavaliado", e o botão "Reavaliar" deixa de aparecer para ela.
*/

import { useState, useTransition, useMemo } from 'react'
import { useToast } from '@/components/ToastContext'
import { Target, ArrowRight, GraduationCap, Compass, CheckCircle2, Edit2, Check, X, Search, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { 
  saveOnboardingComplete, 
  updateCursoDesejado, 
  updateNivelMateria, 
  updateExamGoalTarget 
} from './actions'
import cursosJson from '@/data/cursos.json'

interface Materia {
  id: string
  name: string
}

interface ObjetivoClientProps {
  initialData: {
    examGoal: { name: string; target_date: string } | null
    context: { 
      curso_desejado: string | null; 
      curso_id?: string | null;
      nota_alvo_geral?: number | null;
      nota_alvo_areas?: Record<string, number> | null;
      nivel_percebido: Record<string, string>; 
      onboarding_completo: boolean 
    } | null
    materias: Materia[]
  }
}

interface GapInfo {
  area: string
  gap: number
  faixa: 'alto' | 'moderado' | 'baixo'
  materias: Materia[]
  nivelRealStr: string
}

const mapMateriaToArea = (nome: string): string => {
  const norm = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  if (norm.includes('matematica')) return 'matematica'
  if (['fisica', 'quimica', 'biologia', 'natureza'].some(a => norm.includes(a))) return 'natureza'
  if (['historia', 'geografia', 'filosofia', 'sociologia', 'humanas'].some(a => norm.includes(a))) return 'humanas'
  if (['portugues', 'literatura', 'ingles', 'espanhol', 'artes', 'linguagens'].some(a => norm.includes(a))) return 'linguagens'
  if (norm.includes('redacao')) return 'redacao'
  return 'outros'
}

const calcularGapsPorArea = (
  pesos: Record<string, number>,
  niveis: Record<string, string>,
  materias: Materia[]
): GapInfo[] => {
  const areaGroups: Record<string, Materia[]> = {}
  
  materias.forEach(m => {
    const nivelStr = niveis[m.id]
    if (!nivelStr) return
    
    const area = mapMateriaToArea(m.name)
    if (area === 'outros') return
    
    if (!areaGroups[area]) areaGroups[area] = []
    areaGroups[area].push(m)
  })
  
  const gaps: GapInfo[] = []
  const valNivel: Record<string, number> = { iniciante: 1, intermediario: 2, avancado: 3 }
  const nomeNivel: Record<string, string> = { iniciante: 'iniciante', intermediario: 'intermediário', avancado: 'avançado' }

  for (const [area, mats] of Object.entries(areaGroups)) {
    const peso = pesos[area as keyof typeof pesos] || 1
    if (peso < 2) continue

    let sum = 0
    const niveisUnicos = new Set<string>()
    
    mats.forEach(m => {
      const str = niveis[m.id]
      sum += valNivel[str] || 0
      niveisUnicos.add(nomeNivel[str] || str)
    })
    
    const nivelMedio = sum / mats.length
    const gap = peso * (3 - nivelMedio)
    
    let faixa: 'alto' | 'moderado' | 'baixo' = 'baixo'
    if (gap >= 5) faixa = 'alto'
    else if (gap >= 2 && gap < 5) faixa = 'moderado'
    
    const nivelRealStr = Array.from(niveisUnicos).join('/')

    gaps.push({ area, gap, faixa, materias: mats, nivelRealStr })
  }
  
  return gaps.sort((a, b) => b.gap - a.gap)
}

const gerarFraseAnaliseFoco = (gaps: GapInfo[], nomeCurso: string): string | null => {
  if (gaps.length === 0) return null
  
  const altos = gaps.filter(g => g.faixa === 'alto')
  const moderados = gaps.filter(g => g.faixa === 'moderado')
  
  const formatName = (g: GapInfo) => {
    if (g.materias.length === 1) return g.materias[0].name
    const map: Record<string, string> = {
      matematica: 'Matemática',
      natureza: 'Ciências da Natureza',
      humanas: 'Ciências Humanas',
      linguagens: 'Linguagens',
      redacao: 'Redação'
    }
    return map[g.area] || g.area
  }

  if (altos.length === 0 && moderados.length === 0) {
    return `Suas áreas mais importantes para ${nomeCurso} já estão em bom nível. Mantenha a consistência.`
  }
  
  if (altos.length === 1) {
    const g = altos[0]
    return `${formatName(g)} é a área mais importante para ${nomeCurso} e ainda está em nível ${g.nivelRealStr} — é onde vale concentrar esforço agora.`
  }
  
  if (altos.length >= 2) {
    const g1 = altos[0]
    const g2 = altos[1]
    const uniqueLevels = Array.from(new Set([g1.nivelRealStr, g2.nivelRealStr].flatMap(s => s.split('/')))).join('/')
    return `${formatName(g1)} e ${formatName(g2)}, as áreas mais relevantes para ${nomeCurso}, ainda estão em nível ${uniqueLevels} — vale priorizar essas áreas nas próximas semanas.`
  }
  
  if (altos.length === 0 && moderados.length >= 1) {
    if (moderados.length === 1) {
      return `Você já tem uma base em ${formatName(moderados[0])} mas ainda há espaço pra evoluir nessa área antes da prova.`
    } else {
      return `Você já tem uma base em ${formatName(moderados[0])} e ${formatName(moderados[1])} mas ainda há espaço pra evoluir nessas áreas antes da prova.`
    }
  }
  
  return null
}

export default function ObjetivoClient({ initialData }: ObjetivoClientProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [examGoalState, setExamGoalState] = useState(initialData.examGoal)
  
  const isComplete = initialData.context?.onboarding_completo || false
  const [step, setStep] = useState(isComplete ? 0 : 1)
  
  const [examType, setExamType] = useState<'ENEM' | 'OUTRO' | null>(null)
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState('')
  
  const [curso, setCurso] = useState(initialData.context?.curso_desejado || '')
  const [cursoId, setCursoId] = useState<string | null>(initialData.context?.curso_id || null)
  const [notaGeral, setNotaGeral] = useState<number | ''>(initialData.context?.nota_alvo_geral || '')
  const [notaAreas, setNotaAreas] = useState<Record<string, number>>(initialData.context?.nota_alvo_areas || {})
  const [niveis, setNiveis] = useState<Record<string, string>>(initialData.context?.nivel_percebido || {})

  const [isEditingCourse, setIsEditingCourse] = useState(false)
  const [isCourseChangeModalOpen, setIsCourseChangeModalOpen] = useState(false)
  const [isEditingExam, setIsEditingExam] = useState(false)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)

  const [cursoSearch, setCursoSearch] = useState(initialData.context?.curso_desejado || '')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const normalizedSearch = cursoSearch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  const filteredCursos = useMemo(() => {
    if (!normalizedSearch) return []
    return cursosJson.filter(c => 
      c.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedSearch)
    ).slice(0, 6)
  }, [normalizedSearch])

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
        cursoId,
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

  const executeSaveCourse = (clearMetas: boolean) => {
    startTransition(async () => {
      const payload = {
        curso: cursoSearch,
        curso_id: cursoId,
        nota_alvo_geral: notaGeral === '' ? null : notaGeral,
        nota_alvo_areas: clearMetas ? null : (Object.keys(notaAreas).length > 0 ? notaAreas : null)
      }
      const result = await updateCursoDesejado(payload)
      if (result.success) {
        setCurso(cursoSearch)
        if (clearMetas) setNotaAreas({})
        setIsEditingCourse(false)
        setIsCourseChangeModalOpen(false)
        toast('Curso e metas atualizados.', 'success')
      }
    })
  }

  const handleSaveCourseData = () => {
    const originalCursoId = initialData.context?.curso_id;
    const hasNotaAlvoAreas = initialData.context?.nota_alvo_areas && Object.keys(initialData.context.nota_alvo_areas).length > 0;

    if (originalCursoId && cursoId && originalCursoId !== cursoId && hasNotaAlvoAreas) {
      setIsCourseChangeModalOpen(true);
    } else {
      executeSaveCourse(false);
    }
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
        setExamGoalState({ name: finalName, target_date: finalDate })
        setIsEditingExam(false)
        toast('Alvo atualizado.', 'success')
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

  const sortedMaterias = useMemo(() => {
    const arr = [...initialData.materias]
    if (!cursoId) return arr

    const selectedCourse = cursosJson.find(c => c.id === cursoId)
    if (!selectedCourse) return arr

    return arr.sort((a, b) => {
      const areaA = mapMateriaToArea(a.name)
      const areaB = mapMateriaToArea(b.name)
      
      if (areaA === 'outros' && areaB !== 'outros') return 1
      if (areaB === 'outros' && areaA !== 'outros') return -1

      const weightA = selectedCourse.pesos[areaA as keyof typeof selectedCourse.pesos] || 1
      const weightB = selectedCourse.pesos[areaB as keyof typeof selectedCourse.pesos] || 1
      return weightB - weightA
    })
  }, [initialData.materias, cursoId])

  const getInterpretationPhrase = () => {
    if (!cursoId) return null
    const selectedCourse = cursosJson.find(c => c.id === cursoId)
    if (!selectedCourse) return null

    const gaps = calcularGapsPorArea(selectedCourse.pesos, niveis, initialData.materias)
    const texto = gerarFraseAnaliseFoco(gaps, selectedCourse.nome)
    
    return texto ? `Análise feita pelo Revyza: ${texto}` : null
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
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-8 relative">
            <input 
              type="text" 
              value={cursoSearch} 
              onChange={e => { setCursoSearch(e.target.value); setCursoId(null); setShowSuggestions(true) }} 
              placeholder="Ex: Medicina, Engenharia, Direito..." 
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-primary-500 text-center" 
              autoFocus
            />
            {showSuggestions && filteredCursos.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-lg z-10 overflow-hidden p-2">
                {filteredCursos.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setCursoSearch(c.nome); setCursoId(c.id); setCurso(c.nome); setShowSuggestions(false) }}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse md:flex-row justify-between gap-4">
            <button onClick={() => { setCurso(cursoSearch); setStep(3) }} className="px-6 py-3.5 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition">
              Pular esta etapa
            </button>
            <button onClick={() => { setCurso(cursoSearch); setStep(3) }} className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-sm">
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
                        className={`flex-1 md:w-28 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors ${niveis[m.id] === nivel ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
            <button onClick={handleCompleteOnboarding} disabled={isPending} className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-sm disabled:opacity-50">
              {isPending ? 'Salvando...' : 'Finalizar Configuração'} <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentExamName = examGoalState?.name || 'Não definido'
  const currentExamDate = examGoalState?.target_date || null
  const daysRemaining = calculateDaysRemaining(currentExamDate)
  const interpretationPhrase = getInterpretationPhrase()

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Seu Objetivo</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">O contexto que norteia a urgência dos seus estudos diários.</p>
        </div>

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
                  <button onClick={() => {
                    setIsEditingExam(false)
                    setExamType(currentExamName.includes('ENEM') ? 'ENEM' : 'OUTRO')
                    setExamName(currentExamName)
                    setExamDate(currentExamDate ? currentExamDate.substring(0, 10) : '')
                  }} className="flex-1 py-2 text-xs font-bold text-primary-200 hover:text-white transition">Cancelar</button>
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

        {interpretationPhrase && (
          <p className="text-slate-600 text-sm leading-relaxed px-2">
            {interpretationPhrase}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center transition-all ${isEditingCourse ? 'lg:col-span-3' : 'lg:col-span-1'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Curso Desejado</span>
              {!isEditingCourse && (
                <button onClick={() => setIsEditingCourse(true)} className="p-2 text-slate-400 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 rounded-xl transition">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditingCourse ? (
              <div className="space-y-6">
                <div className="relative">
                  <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Nome do Curso</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 overflow-hidden">
                    <div className="pl-4 text-slate-400"><Search className="w-4 h-4"/></div>
                    <input 
                      type="text" 
                      value={cursoSearch} 
                      onChange={e => { setCursoSearch(e.target.value); setCursoId(null); setShowSuggestions(true) }} 
                      className="w-full px-3 py-3 bg-transparent text-sm font-medium focus:outline-none"
                      placeholder="Busque ou digite seu curso..."
                    />
                  </div>
                  {showSuggestions && filteredCursos.length > 0 && (
                    <div className="absolute top-full left-0 w-full md:w-1/2 mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-20 overflow-hidden p-2">
                      {filteredCursos.map(c => (
                        <button key={c.id} onClick={() => { setCursoSearch(c.nome); setCursoId(c.id); setShowSuggestions(false) }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                          {c.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-2 block flex items-center gap-1">Nota Geral <span className="text-[9px] text-slate-400 normal-case font-normal">(Referência)</span></label>
                    <input type="number" placeholder="Ex: 750" value={notaGeral} onChange={e => setNotaGeral(e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  {['matematica', 'natureza', 'linguagens', 'humanas', 'redacao'].map(area => (
                    <div key={area} className="md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block truncate">{area}</label>
                      <input type="number" placeholder="—" value={notaAreas[area] || ''} onChange={e => setNotaAreas({...notaAreas, [area]: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => {
                    setIsEditingCourse(false)
                    setCursoSearch(initialData.context?.curso_desejado || '')
                    setCursoId(initialData.context?.curso_id || null)
                  }} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">Cancelar</button>
                  <button onClick={handleSaveCourseData} disabled={isPending} className="px-8 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition">Salvar Metas</button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 break-words mb-4">{curso || <span className="text-slate-300 italic font-medium text-lg">Ainda não definido</span>}</h3>
                {notaGeral && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-lg">Meta: {notaGeral} pts</span>
                  </div>
                )}
                {Object.keys(notaAreas).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(notaAreas).map(([area, val]) => (
                      <span key={area} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase tracking-wider">{area}: {val}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-sm ${isEditingCourse ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            <div className="flex items-center gap-2 mb-6">
              <Compass className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-slate-900">Meu perfil por disciplina</h3>
            </div>

            {sortedMaterias.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-slate-500 text-sm font-medium">Nenhuma matéria para avaliar.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {sortedMaterias.map(m => {
                    const nivelAtual = niveis[m.id]
                    const isEditing = editingSubjectId === m.id
                    const isOutros = mapMateriaToArea(m.name) === 'outros'

                    return (
                      <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 border border-transparent hover:border-slate-100 hover:bg-slate-50 rounded-xl transition-all gap-3">
                        <span className="font-bold text-slate-800 text-sm">
                          {m.name}
                          {isOutros && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-2">Área não identificada</span>
                          )}
                        </span>
                        
                        {isEditing ? (
                          <div className="flex bg-slate-200/60 p-1 rounded-xl shrink-0 w-full md:w-auto">
                            {['iniciante', 'intermediario', 'avancado'].map(nivel => (
                              <button
                                key={nivel}
                                onClick={() => handleUpdateLevelInline(m.id, nivel)}
                                disabled={isPending}
                                className={`flex-1 md:w-24 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${niveis[m.id] === nivel ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                {nivel === 'intermediario' ? 'Interm.' : nivel}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                            {nivelAtual ? (
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${nivelAtual === 'iniciante' ? 'bg-orange-100 text-orange-700' : nivelAtual === 'intermediario' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
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
                {sortedMaterias.length > 0 && sortedMaterias.length < 3 && (
                  <p className="text-xs text-slate-400 mt-5 text-center px-4">
                    Cadastre mais matérias em <Link href="/dashboard/materias" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">Minhas Matérias</Link> para ver seu perfil completo por disciplina.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isCourseChangeModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-overlay">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-modal">
            <div className="flex justify-between items-start mb-5">
              <h3 className="text-xl font-bold flex items-center gap-2 text-amber-600 leading-tight">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                Suas metas por área foram definidas para {initialData.context?.curso_desejado}
              </h3>
              <button 
                onClick={() => setIsCourseChangeModalOpen(false)} 
                disabled={isPending}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition shrink-0"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
              Trocar de curso pode tornar essas metas desatualizadas. O que você deseja fazer?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => executeSaveCourse(false)}
                disabled={isPending}
                className="w-full px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
              >
                Manter valores
              </button>
              <button
                onClick={() => executeSaveCourse(true)}
                disabled={isPending}
                className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                Limpar e definir depois
              </button>
              <button
                onClick={() => setIsCourseChangeModalOpen(false)}
                disabled={isPending}
                className="w-full px-4 py-2.5 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancelar troca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}