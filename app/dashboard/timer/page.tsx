'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/components/ToastContext'
import { getMaterias } from '@/app/dashboard/materias/actions'
import { getTopicosEAssuntos } from '@/app/dashboard/materias/[materia]/actions'
import { saveTimerSession, getTimerHistory, deleteTimerSession } from './actions'
import { ChevronDown, Settings, Maximize, Minimize, Plus, ChevronRight, HelpCircle, X, CheckCircle, XCircle, Clock, Book, FileText, Play, Pause, Check, Coffee, Trash2, RefreshCw, RotateCcw } from 'lucide-react'

interface Materia {
  id: string
  name: string
  goalHours: number
  studiedHours: number
  studiedMinutes: number
  progress: number
}

interface Topico {
  id: string
  name: string
}

interface Assunto {
  id: string
  topico_id: string
  name: string
  duration_minutes: number
  is_done: boolean
}

interface StudySession {
  id: string
  duration_seconds: number
  questions_done: number
  questions_wrong: number
  session_date: string
  materias?: { name: string }
  assuntos?: { name: string }
}

// Microcomponente Isolado para o Relógio
function ClockDisplay({ isRunning, phase, timerConfig, onPhaseChange, initialSeconds }: any) {
  const [displaySeconds, setDisplaySeconds] = useState(initialSeconds)
  const lastTickRef = useRef<number>(Date.now())

  useEffect(() => {
    setDisplaySeconds(initialSeconds)
  }, [initialSeconds, timerConfig.type])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      lastTickRef.current = Date.now()
      
      interval = setInterval(() => {
        const now = Date.now()
        const deltaSeconds = Math.floor((now - lastTickRef.current) / 1000)
        
        if (deltaSeconds >= 1) {
          lastTickRef.current += deltaSeconds * 1000

          setDisplaySeconds((prev: number) => {
            if (timerConfig.type === 'cronometro' && phase === 'study') {
              onPhaseChange('tick_study', deltaSeconds)
              return prev + deltaSeconds
            } else {
              const next = prev - deltaSeconds
              if (next <= 0) {
                onPhaseChange('end_phase')
                return 0
              }
              if (phase === 'study') onPhaseChange('tick_study', deltaSeconds)
              return next
            }
          })
        }
      }, 500)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isRunning, phase, timerConfig, onPhaseChange])

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const remSeconds = totalSeconds % 60
    
    if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remSeconds).padStart(2, '0')}`
    return `${String(minutes).padStart(2, '0')}:${String(remSeconds).padStart(2, '0')}`
  }

  return (
    <div className={`text-6xl sm:text-[8rem] md:text-[10rem] font-bold tracking-tight mb-8 font-mono leading-none ${phase === 'rest' ? 'text-emerald-500' : 'text-slate-900'}`}>
      {formatTime(displaySeconds)}
    </div>
  )
}

export default function TimerPage() {
  const [totalStudySeconds, setTotalStudySeconds] = useState(0)
  const [currentDisplaySeconds, setCurrentDisplaySeconds] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'study' | 'rest'>('idle')
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const { toast } = useToast()
  
  const [pomodoroCycles, setPomodoroCycles] = useState(0)
  const totalStudySecondsRef = useRef(totalStudySeconds)
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [timerConfig, setTimerConfig] = useState<{
    type: 'cronometro' | 'pomodoro',
    pomodoroStudy: number,
    pomodoroRest: number,
    cronometroRestPerc: number
  }>({
    type: 'cronometro',
    pomodoroStudy: 25,
    pomodoroRest: 5,
    cronometroRestPerc: 20
  })
  const [draftConfig, setDraftConfig] = useState(timerConfig)

  const [showHistory, setShowHistory] = useState(false)
  const [historySessions, setHistorySessions] = useState<StudySession[]>([])
  const [expandedDates, setExpandedDates] = useState<string[]>([])

  const [materias, setMaterias] = useState<Materia[]>([])
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>('geral')
  const [topicos, setTopicos] = useState<Topico[]>([])
  const [assuntos, setAssuntos] = useState<Assunto[]>([])
  const [selectedAssuntoId, setSelectedAssuntoId] = useState<string>('geral')

  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
  const [questionsDone, setQuestionsDone] = useState<string>('')
  const [questionsWrong, setQuestionsWrong] = useState<string>('')

  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [modalAssuntos, setModalAssuntos] = useState<Assunto[]>([])
  const [manualForm, setManualForm] = useState({
    materiaId: 'geral',
    assuntoId: 'geral',
    durationMinutes: '',
    sessionDate: '',
    questionsDone: '',
    questionsWrong: ''
  })

  useEffect(() => {
    totalStudySecondsRef.current = totalStudySeconds
  }, [totalStudySeconds])

  useEffect(() => {
    const fetchInitialData = async () => {
      const [materiasResult, historyResult] = await Promise.all([
        getMaterias(),
        getTimerHistory()
      ])
      
      if (materiasResult.success && materiasResult.data && materiasResult.data.length > 0) {
        setMaterias(materiasResult.data)
      }
      
      if (historyResult.success && historyResult.data) {
        const formattedHistory = historyResult.data.map((session: any) => ({
          ...session,
          materias: Array.isArray(session.materias) ? session.materias[0] : session.materias,
          assuntos: Array.isArray(session.assuntos) ? session.assuntos[0] : session.assuntos,
        })) as StudySession[]
        
        setHistorySessions(formattedHistory)
      }
    }
    fetchInitialData()
  }, [])

  useEffect(() => {
    const fetchAssuntosForMateria = async () => {
      if (!selectedMateriaId || selectedMateriaId === 'geral') {
        setTopicos([])
        setAssuntos([])
        setSelectedAssuntoId('geral')
        return
      }
      const materiaObj = materias.find(m => m.id === selectedMateriaId)
      if (!materiaObj) return

      const result = await getTopicosEAssuntos(materiaObj.id)
      if (!result.error) {
        setTopicos(result.topicos || [])
        setAssuntos(result.assuntos || [])
        if (result.assuntos && result.assuntos.length > 0) {
          setSelectedAssuntoId(result.assuntos[0].id)
        } else {
          setSelectedAssuntoId('geral')
        }
      }
    }
    fetchAssuntosForMateria()
  }, [selectedMateriaId, materias])

  useEffect(() => {
    const fetchModalAssuntos = async () => {
      if (!manualForm.materiaId || manualForm.materiaId === 'geral') {
        setModalAssuntos([])
        setManualForm(prev => ({ ...prev, assuntoId: 'geral' }))
        return
      }
      const materiaObj = materias.find(m => m.id === manualForm.materiaId)
      if (!materiaObj) return

      const result = await getTopicosEAssuntos(materiaObj.id)
      if (!result.error) {
        setModalAssuntos(result.assuntos || [])
        if (!result.assuntos?.find((a: Assunto) => a.id === manualForm.assuntoId)) {
          setManualForm(prev => ({ ...prev, assuntoId: result.assuntos?.[0]?.id || 'geral' }))
        }
      }
    }
    if (isManualModalOpen) {
      fetchModalAssuntos()
    }
  }, [manualForm.materiaId, isManualModalOpen, materias])

  const handlePhaseChange = useCallback((action: string, delta?: number) => {
    if (action === 'tick_study' && delta) {
      setTotalStudySeconds(prev => prev + delta)
    }
    if (action === 'end_phase') {
      if (phase === 'study') {
        setPhase('rest')
        setCurrentDisplaySeconds(timerConfig.pomodoroRest * 60)
      } else {
        setIsRunning(false)
        setPhase('idle')
        if (timerConfig.type === 'pomodoro') {
          setPomodoroCycles(c => c + 1)
          setCurrentDisplaySeconds(timerConfig.pomodoroStudy * 60)
        }
      }
    }
  }, [phase, timerConfig])

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const remSeconds = totalSeconds % 60
    
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remSeconds).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(remSeconds).padStart(2, '0')}`
  }

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  const formatDateToPortuguese = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    let formatted = date.toLocaleDateString('pt-BR', options)
    return capitalize(formatted).replace('-feira', '-feira')
  }

  const groupedHistory = historySessions.reduce((acc, session) => {
    if (!acc[session.session_date]) acc[session.session_date] = []
    acc[session.session_date].push(session)
    return acc
  }, {} as Record<string, StudySession[]>)

  const toggleDate = (dateStr: string) => {
    if (expandedDates.includes(dateStr)) {
      setExpandedDates(expandedDates.filter(d => d !== dateStr))
    } else {
      setExpandedDates([...expandedDates, dateStr])
    }
  }

  const handleStart = () => {
    if (phase === 'idle') {
      setPhase('study')
      if (timerConfig.type === 'pomodoro' && currentDisplaySeconds === 0) {
        setCurrentDisplaySeconds(timerConfig.pomodoroStudy * 60)
      } else if (timerConfig.type === 'cronometro' && currentDisplaySeconds === 0) {
        setCurrentDisplaySeconds(totalStudySeconds)
      }
    }
    setIsRunning(true)
  }

  const handlePause = () => setIsRunning(false)
  
  const handleRestNow = () => {
    if (timerConfig.type !== 'cronometro' || phase !== 'study') return
    const restSecs = Math.floor(totalStudySeconds * (timerConfig.cronometroRestPerc / 100))
    setPhase('rest')
    setCurrentDisplaySeconds(restSecs)
    setIsRunning(true)
  }

  const handleResetTimer = () => {
    if (confirm('Deseja realmente zerar o timer atual? O progresso não salvo será perdido.')) {
      setIsRunning(false)
      setTotalStudySeconds(0)
      setPomodoroCycles(0)
      setPhase('idle')
      if (timerConfig.type === 'pomodoro') {
        setCurrentDisplaySeconds(timerConfig.pomodoroStudy * 60)
      } else {
        setCurrentDisplaySeconds(0)
      }
    }
  }

  const handleFinishRequest = () => {
    if (!selectedMateriaId || !selectedAssuntoId) {
      toast("Selecione uma matéria e um assunto antes de finalizar.", "error")
      return
    }
    setIsRunning(false)
    setQuestionsDone('')
    setQuestionsWrong('')
    setIsFinishModalOpen(true)
  }

const handleConfirmFinish = async () => {
    setIsLoading(true)

    const qDone = parseInt(questionsDone) || 0
    const qWrong = parseInt(questionsWrong) || 0

    const today = new Date()
    const session_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const result = await saveTimerSession({
      materia_id: selectedMateriaId === 'geral' ? null : selectedMateriaId,
      assunto_id: selectedAssuntoId === 'geral' ? null : selectedAssuntoId,
      duration_seconds: totalStudySeconds,
      questions_done: qDone,
      questions_wrong: qWrong,
      session_date
    })

    if (result.success) {
      // CORREÇÃO: Força estritamente os estados a voltarem para 0
      setTotalStudySeconds(0)
      setCurrentDisplaySeconds(0)
      setPomodoroCycles(0)
      setPhase('idle')
      setIsFinishModalOpen(false)
      toast("Sessão salva com sucesso!", "success")
      
      const historyResult = await getTimerHistory()
      if (historyResult.success && historyResult.data) {
        const formattedHistory = historyResult.data.map((session: any) => ({
          ...session,
          materias: Array.isArray(session.materias) ? session.materias[0] : session.materias,
          assuntos: Array.isArray(session.assuntos) ? session.assuntos[0] : session.assuntos,
        })) as StudySession[]
        
        setHistorySessions(formattedHistory)
      }
    } else {
      toast('Erro ao salvar sessão: ' + result.error, "error")
    }

    setIsLoading(false)
  }

  const handleDeleteSession = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de estudo?')) {
      setIsLoading(true)
      const result = await deleteTimerSession(id)
      
      if (result.success) {
        setHistorySessions(prev => prev.filter(session => session.id !== id))
        toast("Registro excluído.", "success")
      } else {
        toast('Erro ao excluir registro: ' + result.error, "error")
      }
      setIsLoading(false)
    }
  }

  const handleSaveSettings = () => {
    if (isRunning || totalStudySeconds > 0 || currentDisplaySeconds > 0) {
      if (!confirm('Alterar as configurações reiniciará o timer atual. Deseja continuar?')) {
        return
      }
    }
    setTimerConfig(draftConfig)
    setIsSettingsOpen(false)
    setIsRunning(false)
    setPhase('idle')
    setTotalStudySeconds(0)
    setPomodoroCycles(0)
    if (draftConfig.type === 'pomodoro') {
      setCurrentDisplaySeconds(draftConfig.pomodoroStudy * 60)
    } else {
      setCurrentDisplaySeconds(0)
    }
  }

  const openSettings = () => {
    setDraftConfig(timerConfig)
    setIsSettingsOpen(true)
  }

  const openManualModal = () => {
    const today = new Date()
    const session_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    setManualForm({
      materiaId: selectedMateriaId,
      assuntoId: selectedAssuntoId,
      durationMinutes: '',
      sessionDate: session_date,
      questionsDone: '',
      questionsWrong: ''
    })
    setIsManualModalOpen(true)
  }

  const handleConfirmManual = async () => {
    if (!manualForm.materiaId || !manualForm.assuntoId || !manualForm.durationMinutes || !manualForm.sessionDate) {
      toast("Preencha matéria, assunto, data e tempo em minutos.", "error")
      return
    }

    setIsLoading(true)
    const qDone = parseInt(manualForm.questionsDone) || 0
    const qWrong = parseInt(manualForm.questionsWrong) || 0
    const durationSeconds = (parseInt(manualForm.durationMinutes) || 0) * 60

    const result = await saveTimerSession({
      materia_id: manualForm.materiaId === 'geral' ? null : manualForm.materiaId,
      assunto_id: manualForm.assuntoId === 'geral' ? null : manualForm.assuntoId,
      duration_seconds: durationSeconds,
      questions_done: qDone,
      questions_wrong: qWrong,
      session_date: manualForm.sessionDate
    })

    if (result.success) {
      setIsManualModalOpen(false)
      toast("Sessão manual salva com sucesso!", "success")
      
      const historyResult = await getTimerHistory()
      if (historyResult.success && historyResult.data) {
        const formattedHistory = historyResult.data.map((session: any) => ({
          ...session,
          materias: Array.isArray(session.materias) ? session.materias[0] : session.materias,
          assuntos: Array.isArray(session.assuntos) ? session.assuntos[0] : session.assuntos,
        })) as StudySession[]
        setHistorySessions(formattedHistory)
      }
    } else {
      toast('Erro ao salvar sessão: ' + result.error, "error")
    }
    setIsLoading(false)
  }

  const selectedMateriaName = selectedMateriaId === 'geral' ? 'Geral' : (materias.find(m => m.id === selectedMateriaId)?.name || 'Geral')
  const selectedAssuntoName = selectedAssuntoId === 'geral' ? 'Geral' : (assuntos.find(a => a.id === selectedAssuntoId)?.name || 'Geral')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden p-8 flex flex-col items-center">
      
      <div className="max-w-7xl w-full flex-1 flex flex-col justify-between relative">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Timer</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Gerencie seu tempo de estudo e foco</p>
        </div>

        {/* CONTROLES SUPERIORES */}
        <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4">
          <div className="flex flex-col w-full sm:w-auto gap-3">
            <div className="relative">
              <select
                value={selectedMateriaId}
                onChange={(e) => setSelectedMateriaId(e.target.value)}
                className="w-full sm:w-auto appearance-none flex items-center justify-between gap-4 px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold uppercase bg-white text-slate-700 hover:bg-primary-600 hover:text-white transition-colors hover:border-primary-600 cursor-pointer pr-10 focus:outline-none shadow-sm"
              >
                <option value="geral" className="text-slate-900 bg-white">Matéria: Geral</option>
                {materias.map(m => (
                  <option key={m.id} value={m.id} className="text-slate-900 bg-white">
                    Matéria: {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedAssuntoId}
                onChange={(e) => setSelectedAssuntoId(e.target.value)}
                className="w-full sm:w-auto appearance-none flex items-center justify-between gap-4 px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold uppercase bg-white text-slate-700 hover:bg-primary-600 hover:text-white transition-colors hover:border-primary-600 cursor-pointer pr-10 focus:outline-none shadow-sm"
              >
                <option value="geral" className="text-slate-900 bg-white">Assunto: Geral</option>
                {assuntos.map(a => (
                  <option key={a.id} value={a.id} className="text-slate-900 bg-white">
                    Assunto: {a.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-3 items-center self-end sm:self-auto">
            <button 
              onClick={openSettings}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-primary-600 hover:text-white transition-colors hover:border-primary-600 shadow-sm"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsMaximized(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-primary-600 hover:text-white transition-colors hover:border-primary-600 shadow-sm"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CENTRO (TIMER E CONTROLES) */}
        <div className={isMaximized ? "fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-200" : "flex flex-col items-center justify-center flex-1 my-10"}>
          
          {isMaximized && (
            <button 
              onClick={() => setIsMaximized(false)}
              className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
              title="Voltar ao normal"
            >
              <Minimize className="w-5 h-5" />
            </button>
          )}

          {isMaximized && (
             <div className="mb-10 text-center animate-in slide-in-from-top-4 duration-300">
               <h2 className="text-2xl font-bold text-slate-900">{selectedMateriaName}</h2>
               <p className="text-slate-500 font-medium">{selectedAssuntoName}</p>
             </div>
          )}

          {timerConfig.type === 'pomodoro' && (
            <div className="mb-2 text-primary-600 font-bold uppercase tracking-widest text-sm animate-in fade-in flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Ciclos Concluídos: {pomodoroCycles}
            </div>
          )}

          {phase === 'rest' && (
            <div className="mb-4 text-emerald-500 font-bold uppercase tracking-widest text-sm animate-pulse flex items-center gap-2">
              <Coffee className="w-5 h-5" />
              Tempo de Descanso
            </div>
          )}

          <ClockDisplay 
            isRunning={isRunning} 
            phase={phase} 
            timerConfig={timerConfig} 
            initialSeconds={currentDisplaySeconds}
            onPhaseChange={handlePhaseChange}
          />

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {phase === 'idle' && currentDisplaySeconds === 0 ? (
              <button
                onClick={handleStart}
                disabled={isLoading}
                className="px-6 py-3 md:px-8 md:py-3.5 bg-primary-600 text-white font-bold rounded-full hover:bg-primary-700 focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-md flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> Iniciar
              </button>
            ) : (
              <>
                {isRunning ? (
                  <button
                    onClick={handlePause}
                    disabled={isLoading}
                    className="px-6 py-3 md:px-8 md:py-3.5 bg-slate-200 text-slate-800 font-bold rounded-full hover:bg-slate-300 focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-sm flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4 fill-current" /> Pausar
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    disabled={isLoading}
                    className="px-6 py-3 md:px-8 md:py-3.5 bg-primary-600 text-white font-bold rounded-full hover:bg-primary-700 focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-md flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" /> Retomar
                  </button>
                )}

                <button
                  onClick={handleFinishRequest}
                  disabled={isLoading}
                  className="px-6 py-3 md:px-8 md:py-3.5 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Finalizar
                </button>

                {timerConfig.type === 'cronometro' && phase === 'study' && totalStudySeconds > 300 && (
                  <button
                    onClick={handleRestNow}
                    disabled={totalStudySeconds === 0}
                    className="px-6 py-3 md:px-8 md:py-3.5 bg-amber-100 text-amber-800 font-bold rounded-full hover:bg-amber-200 focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-sm flex items-center gap-2 border border-amber-200"
                  >
                    <Coffee className="w-4 h-4" /> Descansar Agora
                  </button>
                )}

                <button
                  onClick={handleResetTimer}
                  disabled={isLoading}
                  className="px-6 py-3 md:px-8 md:py-3.5 bg-red-100 text-red-800 font-bold rounded-full hover:bg-red-200 focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-sm flex items-center gap-2 border border-red-200"
                >
                  <RotateCcw className="w-4 h-4" /> Reiniciar
                </button>
              </>
            )}
          </div>
          
          {!isMaximized && (
            <div className="flex flex-col items-center gap-2 px-2 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 text-slate-500 text-xs font-medium">
                <HelpCircle className="w-4 h-4 text-primary-600 hidden sm:block" />
                <span>Esqueceu de ligar o timer ou estudou fora daqui? Manda seu tempo aí embaixo</span>
              </div>
              <button 
                onClick={openManualModal}
                className="px-6 py-2.5 bg-white text-slate-700 rounded-full text-xs font-bold uppercase hover:bg-slate-100 shadow-sm transition-colors border border-slate-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Enviar tempo manual
              </button>
            </div>
          )}
        </div>

        {/* RODAPÉ (HISTÓRICO) */}
        <div className="w-full pb-8">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-center w-full md:w-auto gap-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">HISTÓRICO</h3>
            <Plus className={`w-4 h-4 text-slate-900 transition-transform duration-300 ${showHistory ? 'rotate-45' : ''}`} />
          </button>
          
          {showHistory && (
            <div className="w-full flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
              {Object.keys(groupedHistory).length === 0 ? (
                <div className="text-sm text-slate-500 bg-white p-6 rounded-2xl text-center border border-slate-200 flex flex-col items-center gap-2 shadow-sm">
                  <Clock className="w-8 h-8 text-slate-300 mb-1" />
                  <p className="text-slate-600">Até agora você ainda não tem nada por aqui.</p>
                  <p className="font-medium text-slate-700">Clique em <strong className="text-primary-600">Iniciar</strong> acima ou envie um estudo manual para começar!</p>
                </div>
              ) : (
                Object.keys(groupedHistory)
                  .sort((a, b) => b.localeCompare(a))
                  .map(dateStr => (
                  <div key={dateStr} className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleDate(dateStr)}
                      className="w-full flex items-center justify-between px-6 py-4 rounded-full border border-slate-200 hover:border-primary-600 transition-colors group bg-white shadow-sm hover:shadow"
                    >
                      <span className="text-sm font-bold text-slate-700 uppercase truncate pr-4">
                        {formatDateToPortuguese(dateStr)}
                      </span>
                      <ChevronRight className={`w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-primary-600 transition-transform ${expandedDates.includes(dateStr) ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {expandedDates.includes(dateStr) && (
                      <div className="flex flex-col gap-3 px-2 pb-2">
                        {groupedHistory[dateStr].map(session => (
                          <div key={session.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm mx-1 sm:mx-2 group">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2">
                                <Book className="w-4 h-4 flex-shrink-0 text-primary-600" />
                                <span className="font-bold text-slate-800 text-sm truncate max-w-[120px] sm:max-w-xs">{session.materias?.name || 'Geral'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 flex-shrink-0 text-slate-400" />
                                  <span className="text-sm font-bold text-slate-700">{formatTime(session.duration_seconds)}</span>
                                </div>
                                <button 
                                  onClick={() => handleDeleteSession(session.id)}
                                  disabled={isLoading}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                  title="Excluir estudo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                <FileText className="w-4 h-4 flex-shrink-0 text-slate-400" />
                                <span className="truncate">{session.assuntos?.name || 'Geral'}</span>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-xs font-bold border border-emerald-200">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {session.questions_done} FEITAS
                                </div>
                                <div className="flex items-center gap-1.5 bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs font-bold border border-red-200">
                                  <XCircle className="w-3.5 h-3.5" />
                                  {session.questions_wrong} ERRADAS
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE CONFIGURAÇÕES */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-modal">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Configurações do Timer</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setDraftConfig({...draftConfig, type: 'cronometro'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${draftConfig.type === 'cronometro' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cronômetro
                </button>
                <button
                  onClick={() => setDraftConfig({...draftConfig, type: 'pomodoro'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${draftConfig.type === 'pomodoro' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Pomodoro
                </button>
              </div>

              {draftConfig.type === 'pomodoro' ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Selecione o formato</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { s: 25, r: 5 },
                      { s: 30, r: 5 },
                      { s: 45, r: 10 },
                      { s: 50, r: 10 },
                      { s: 60, r: 15 }
                    ].map((preset, idx) => {
                      const isSelected = draftConfig.pomodoroStudy === preset.s && draftConfig.pomodoroRest === preset.r;
                      return (
                        <button
                          key={idx}
                          onClick={() => setDraftConfig({...draftConfig, pomodoroStudy: preset.s, pomodoroRest: preset.r})}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isSelected ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                        >
                          <span className="font-bold">{preset.s} min estudo</span>
                          <span className="text-sm font-medium opacity-80">{preset.r} min descanso</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Intervalo proporcional</label>
                  <p className="text-xs text-slate-500 mb-2">O tempo de pausa será calculado automaticamente sempre que você iniciar um descanso.</p>
                  <select
                    value={draftConfig.cronometroRestPerc}
                    onChange={(e) => setDraftConfig({...draftConfig, cronometroRestPerc: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900 font-medium"
                  >
                    <option value={10}>10% do tempo de estudo</option>
                    <option value={15}>15% do tempo de estudo</option>
                    <option value={20}>20% do tempo de estudo</option>
                    <option value={25}>25% do tempo de estudo</option>
                    <option value={30}>30% do tempo de estudo</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-md"
              >
                Salvar 
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FINALIZAÇÃO DA SESSÃO */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-modal">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Finalizar Estudo</h3>
              <button onClick={() => setIsFinishModalOpen(false)} disabled={isLoading} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase truncate max-w-[100px]">Matéria</span>
                <span className="text-sm font-bold text-slate-900 text-right">{selectedMateriaName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase truncate max-w-[100px]">Assunto</span>
                <span className="text-sm font-bold text-slate-900 text-right">{selectedAssuntoName}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-bold uppercase">Tempo</span>
                <span className="text-lg font-bold text-primary-600">{formatTime(totalStudySeconds)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Questões Feitas
                </label>
                <input
                  type="number"
                  min="0"
                  value={questionsDone}
                  onChange={(e) => setQuestionsDone(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  placeholder="Ex: 15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Questões Erradas
                </label>
                <input
                  type="number"
                  min="0"
                  value={questionsWrong}
                  onChange={(e) => setQuestionsWrong(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  placeholder="Ex: 2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsFinishModalOpen(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmFinish}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? 'Salvando...' : 'Salvar Estudo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ENVIO MANUAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-modal">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Enviar Estudo Manual</h3>
              <button onClick={() => setIsManualModalOpen(false)} disabled={isLoading} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Matéria</label>
                <select
                  value={manualForm.materiaId}
                  onChange={(e) => setManualForm({ ...manualForm, materiaId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                >
                  <option value="geral">Geral</option>
                  {materias.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assunto</label>
                <select
                  value={manualForm.assuntoId}
                  onChange={(e) => setManualForm({ ...manualForm, assuntoId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                >
                  <option value="geral">Geral</option>
                  {modalAssuntos.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Data</label>
                  <input
                    type="date"
                    value={manualForm.sessionDate}
                    onChange={(e) => setManualForm({ ...manualForm, sessionDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tempo (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.durationMinutes}
                    onChange={(e) => setManualForm({ ...manualForm, durationMinutes: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                    placeholder="Ex: 60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Questões Feitas</label>
                  <input
                    type="number"
                    min="0"
                    value={manualForm.questionsDone}
                    onChange={(e) => setManualForm({ ...manualForm, questionsDone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                    placeholder="Ex: 15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Questões Erradas</label>
                  <input
                    type="number"
                    min="0"
                    value={manualForm.questionsWrong}
                    onChange={(e) => setManualForm({ ...manualForm, questionsWrong: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                    placeholder="Ex: 2"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsManualModalOpen(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmManual}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-50 shadow-md flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? 'Salvando...' : 'Salvar Estudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}