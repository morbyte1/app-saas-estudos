'use client'

import { useState, useEffect } from 'react'
import { getMaterias } from '@/app/dashboard/materias/actions'
import { getTopicosEAssuntos } from '@/app/dashboard/materias/[materia]/actions'
import { saveTimerSession, getTimerHistory, deleteTimerSession } from './actions'
import { ChevronDown, Settings, Maximize, Minimize, Plus, ChevronRight, Circle, HelpCircle, X, CheckCircle, XCircle, Clock, Book, FileText, Play, Pause, Check, Coffee, Trash2 } from 'lucide-react'

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

export default function TimerPage() {
  // Estados do Timer
  const [totalStudySeconds, setTotalStudySeconds] = useState(0)
  const [currentDisplaySeconds, setCurrentDisplaySeconds] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'study' | 'rest'>('idle')
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  
  // Configurações do Timer
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

  // Estados de Histórico
  const [showHistory, setShowHistory] = useState(false)
  const [historySessions, setHistorySessions] = useState<StudySession[]>([])
  const [expandedDates, setExpandedDates] = useState<string[]>([])

  // Estados para Matérias, Tópicos e Assuntos
  const [materias, setMaterias] = useState<Materia[]>([])
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>('')
  const [topicos, setTopicos] = useState<Topico[]>([])
  const [assuntos, setAssuntos] = useState<Assunto[]>([])
  const [selectedAssuntoId, setSelectedAssuntoId] = useState<string>('')

  // Estados do Modal de Finalização
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
  const [questionsDone, setQuestionsDone] = useState<string>('')
  const [questionsWrong, setQuestionsWrong] = useState<string>('')

  useEffect(() => {
    const fetchInitialData = async () => {
      const [materiasResult, historyResult] = await Promise.all([
        getMaterias(),
        getTimerHistory()
      ])
      
      if (materiasResult.success && materiasResult.data && materiasResult.data.length > 0) {
        setMaterias(materiasResult.data)
        setSelectedMateriaId(materiasResult.data[0].id)
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
      if (!selectedMateriaId) {
        setTopicos([])
        setAssuntos([])
        setSelectedAssuntoId('')
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
          setSelectedAssuntoId('')
        }
      }
    }
    fetchAssuntosForMateria()
  }, [selectedMateriaId, materias])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        if (phase === 'study') {
          setTotalStudySeconds((prev) => prev + 1)
          
          if (timerConfig.type === 'cronometro') {
            setCurrentDisplaySeconds((prev) => prev + 1)
          } else {
            setCurrentDisplaySeconds((prev) => {
              if (prev <= 1) {
                // Pomodoro: Estudo acabou, inicia o descanso automaticamente
                setPhase('rest')
                return timerConfig.pomodoroRest * 60
              }
              return prev - 1
            })
          }
        } else if (phase === 'rest') {
          setCurrentDisplaySeconds((prev) => {
            if (prev <= 1) {
              // Descanso finalizado
              setIsRunning(false)
              setPhase('idle')
              if (timerConfig.type === 'pomodoro') {
                return timerConfig.pomodoroStudy * 60
              }
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, phase, timerConfig])

  // Utilitários de Tempo e Data
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

  // Controles
  const handleStart = () => {
    if (phase === 'idle') {
      setPhase('study')
      if (timerConfig.type === 'pomodoro' && currentDisplaySeconds === 0) {
        setCurrentDisplaySeconds(timerConfig.pomodoroStudy * 60)
      }
    } else if (phase === 'rest' && currentDisplaySeconds === 0) {
      // Se acabou o descanso e clicou em iniciar
      setPhase('study')
      if (timerConfig.type === 'pomodoro') {
        setCurrentDisplaySeconds(timerConfig.pomodoroStudy * 60)
      } else {
        setCurrentDisplaySeconds(0)
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

  const handleFinishRequest = () => {
    if (!selectedMateriaId || !selectedAssuntoId) {
      alert("Selecione uma matéria e um assunto antes de finalizar.")
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
      materia_id: selectedMateriaId,
      assunto_id: selectedAssuntoId,
      duration_seconds: totalStudySeconds, // Salvamos apenas o tempo real de estudo
      questions_done: qDone,
      questions_wrong: qWrong,
      session_date
    })

    if (result.success) {
      setTotalStudySeconds(0)
      if (timerConfig.type === 'pomodoro') {
        setCurrentDisplaySeconds(timerConfig.pomodoroStudy * 60)
      } else {
        setCurrentDisplaySeconds(0)
      }
      setPhase('idle')
      setIsFinishModalOpen(false)
      
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
      alert('Erro ao salvar sessão: ' + result.error)
    }

    setIsLoading(false)
  }

  const handleDeleteSession = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de estudo?')) {
      setIsLoading(true)
      const result = await deleteTimerSession(id)
      
      if (result.success) {
        setHistorySessions(prev => prev.filter(session => session.id !== id))
      } else {
        alert('Erro ao excluir registro: ' + result.error)
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

  const selectedMateriaName = materias.find(m => m.id === selectedMateriaId)?.name || ''
  const selectedAssuntoName = assuntos.find(a => a.id === selectedAssuntoId)?.name || ''

  return (
    <div className="h-screen flex bg-white text-slate-900 overflow-hidden relative">
      
      {/* SEÇÃO ESQUERDA (PRINCIPAL) */}
      <div className="flex-1 p-8 flex flex-col justify-between h-full relative overflow-y-auto">
        
        {/* Header (Topo) */}
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <select
                value={selectedMateriaId}
                onChange={(e) => setSelectedMateriaId(e.target.value)}
                className="appearance-none flex items-center justify-between gap-4 px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold uppercase bg-white text-slate-700 hover:bg-[#8961DA] hover:text-white transition-colors hover:border-[#8961DA] cursor-pointer pr-10 focus:outline-none"
              >
                <option value="" disabled>SELECIONE A MATÉRIA</option>
                {materias.map(m => (
                  <option key={m.id} value={m.id} className="text-slate-900 bg-white">
                    MATÉRIA: {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedAssuntoId}
                onChange={(e) => setSelectedAssuntoId(e.target.value)}
                className="appearance-none flex items-center justify-between gap-4 px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold uppercase bg-white text-slate-700 hover:bg-[#8961DA] hover:text-white transition-colors hover:border-[#8961DA] cursor-pointer pr-10 focus:outline-none"
              >
                <option value="" disabled>SELECIONE O ASSUNTO</option>
                {assuntos.map(a => (
                  <option key={a.id} value={a.id} className="text-slate-900 bg-white">
                    ASSUNTO: {a.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <button 
              onClick={openSettings}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-[#8961DA] hover:text-white transition-colors hover:border-[#8961DA]"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsMaximized(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-[#8961DA] hover:text-white transition-colors hover:border-[#8961DA]"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Centro (Timer e Controles) - Pode ficar em Fullscreen */}
        <div className={isMaximized ? "fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-200" : "flex flex-col items-center justify-center flex-1 my-10"}>
          
          {isMaximized && (
            <button 
              onClick={() => setIsMaximized(false)}
              className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors shadow-sm"
              title="Voltar ao normal"
            >
              <Minimize className="w-5 h-5" />
            </button>
          )}

          {isMaximized && (
             <div className="mb-10 text-center animate-in slide-in-from-top-4 duration-300">
               <h2 className="text-2xl font-bold text-slate-900">{selectedMateriaName || 'Nenhuma matéria'}</h2>
               <p className="text-slate-500 font-medium">{selectedAssuntoName || 'Nenhum assunto'}</p>
             </div>
          )}

          {phase === 'rest' && (
            <div className="mb-4 text-emerald-500 font-bold uppercase tracking-widest text-sm animate-pulse flex items-center gap-2">
              <Coffee className="w-5 h-5" />
              Tempo de Descanso
            </div>
          )}

          <div className={`text-[8rem] sm:text-[10rem] font-bold tracking-tight mb-8 font-mono leading-none ${phase === 'rest' ? 'text-emerald-500' : 'text-slate-900'}`}>
            {formatTime(currentDisplaySeconds)}
          </div>

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <button
              onClick={handleStart}
              disabled={isRunning || isLoading}
              className="px-8 py-3.5 bg-[#8961DA] text-white font-bold rounded-full hover:bg-[#784fcb] focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-md flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Iniciar
            </button>

            <button
              onClick={handlePause}
              disabled={!isRunning || isLoading}
              className="px-8 py-3.5 bg-slate-200 text-slate-800 font-bold rounded-full hover:bg-slate-300 focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-sm flex items-center gap-2"
            >
              <Pause className="w-4 h-4 fill-current" /> Pausar
            </button>

            <button
              onClick={handleFinishRequest}
              disabled={isLoading || totalStudySeconds === 0}
              className="px-8 py-3.5 bg-slate-900 text-white font-bold rounded-full hover:bg-[#8961DA] focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Finalizar
            </button>

            {timerConfig.type === 'cronometro' && phase === 'study' && (
              <button
                onClick={handleRestNow}
                disabled={totalStudySeconds === 0}
                className="px-8 py-3.5 bg-amber-100 text-amber-800 font-bold rounded-full hover:bg-amber-200 focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-sm flex items-center gap-2 border border-amber-200"
              >
                <Coffee className="w-4 h-4" /> Descansar Agora
              </button>
            )}
          </div>
          
          {!isMaximized && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <HelpCircle className="w-4 h-4 text-[#8961DA]" />
                <span>Esqueceu de ligar o timer ou estudou fora do app? Envie seu tempo estudado abaixo</span>
              </div>
              <button className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase hover:bg-slate-200 transition-colors border border-slate-200">
                ENVIAR MANUAL
              </button>
            </div>
          )}
        </div>

        {/* Rodapé (Histórico Dinâmico) */}
        <div className="w-full pb-8">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">HISTÓRICO</h3>
            <Plus className={`w-4 h-4 text-slate-900 transition-transform duration-300 ${showHistory ? 'rotate-45' : ''}`} />
          </button>
          
          {showHistory && (
            <div className="w-full flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
              {Object.keys(groupedHistory).length === 0 ? (
                <div className="text-sm text-slate-500 bg-slate-50 p-6 rounded-2xl text-center border border-slate-100 flex flex-col items-center gap-2 shadow-sm">
                  <Clock className="w-8 h-8 text-slate-300 mb-1" />
                  <p className="text-slate-600">Até o momento você não tem nada registrado.</p>
                  <p className="font-medium text-slate-700">Clique em <strong className="text-[#8961DA]">Iniciar o timer</strong> acima ou envie um estudo manual para começar!</p>
                </div>
              ) : (
                Object.keys(groupedHistory)
                  .sort((a, b) => b.localeCompare(a))
                  .map(dateStr => (
                  <div key={dateStr} className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleDate(dateStr)}
                      className="w-full flex items-center justify-between px-6 py-4 rounded-full border border-slate-200 hover:border-[#8961DA] transition-colors group bg-white shadow-sm hover:shadow"
                    >
                      <span className="text-sm font-bold text-slate-700 uppercase">
                        {formatDateToPortuguese(dateStr)}
                      </span>
                      <ChevronRight className={`w-5 h-5 text-slate-400 group-hover:text-[#8961DA] transition-transform ${expandedDates.includes(dateStr) ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {expandedDates.includes(dateStr) && (
                      <div className="flex flex-col gap-3 px-2 pb-2">
                        {groupedHistory[dateStr].map(session => (
                          <div key={session.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm mx-2 group">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                              <div className="flex items-center gap-2">
                                <Book className="w-4 h-4 text-[#8961DA]" />
                                <span className="font-bold text-slate-800 text-sm">{session.materias?.name || 'Matéria removida'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-slate-400" />
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <span>{session.assuntos?.name || 'Assunto removido'}</span>
                              </div>
                              <div className="flex items-center gap-3">
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

      {/* SEÇÃO DIREITA (SIDEBAR DE TAREFAS PRESERVADO) */}
      <div className="w-80 p-8 flex flex-col gap-6 border-l border-slate-100 h-full bg-white flex-shrink-0 overflow-y-auto">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">TAREFAS</h2>
        
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div 
              key={item} 
              className="flex items-center px-4 h-12 rounded-full border border-slate-100 bg-white hover:border-[#8961DA] transition-colors cursor-pointer group"
            >
              <Circle className="w-4 h-4 text-slate-300 group-hover:text-[#8961DA] transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE CONFIGURAÇÕES */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Configurações do Timer</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Tipo de Timer */}
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

              {/* Opções baseadas no tipo */}
              {draftConfig.type === 'pomodoro' ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Selecione o formato (Estudo / Descanso)</label>
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
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isSelected ? 'border-[#8961DA] bg-purple-50 text-[#8961DA]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
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
                  <label className="block text-sm font-medium text-slate-700">Porcentagem de descanso</label>
                  <p className="text-xs text-slate-500 mb-2">Calculado com base no tempo total estudado ao clicar em "Descansar Agora".</p>
                  <select
                    value={draftConfig.cronometroRestPerc}
                    onChange={(e) => setDraftConfig({...draftConfig, cronometroRestPerc: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8961DA] bg-white text-slate-900 font-medium"
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
                className="flex-1 px-4 py-2.5 bg-[#8961DA] text-white font-bold rounded-xl hover:bg-[#784fcb] transition shadow-md"
              >
                Salvar 
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FINALIZAÇÃO DA SESSÃO */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Finalizar Estudo</h3>
              <button onClick={() => setIsFinishModalOpen(false)} disabled={isLoading} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Informações Read-only */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase">Matéria</span>
                <span className="text-sm font-bold text-slate-900">{selectedMateriaName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase">Assunto</span>
                <span className="text-sm font-bold text-slate-900">{selectedAssuntoName}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-bold uppercase">Tempo Estudado</span>
                <span className="text-lg font-bold text-[#8961DA]">{formatTime(totalStudySeconds)}</span>
              </div>
            </div>

            {/* Campos Preenchíveis */}
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
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8961DA] bg-white"
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
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8961DA] bg-white"
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
                className="flex-1 px-4 py-2.5 bg-[#8961DA] text-white font-bold rounded-xl hover:bg-[#784fcb] transition disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </>
                ) : (
                  'Salvar Estudo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}