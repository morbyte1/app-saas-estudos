'use client'

import ConfirmModal from '@/components/ConfirmModal'
import AsyncButton from '@/components/AsyncButton'
import { useState, useEffect, useTransition } from 'react'
import { useToast } from '@/components/ToastContext'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MoreVertical, 
  Check, 
  X, 
  Copy, 
  Target, 
  Sparkles, 
  Clock, 
  CheckCircle2 
} from 'lucide-react'
import {
  getCalendarData,
  createEvent,
  updateEvent,
  deleteEvent as deleteEventAction,
  toggleEventStatus,
  duplicateEvents,
  getDayContext,
  DayContext,
  ActivityType
} from './actions'
import { gerarSugestaoDoDia, SugestaoDia } from '@/lib/calendarioSugestao'

interface Event {
  id: string
  title: string
  time: string
  duration: number
  subject_id: string | null
  activity_type?: ActivityType | null
  is_done: boolean
  event_date: string
}

interface Materia {
  id: string
  name: string
  goal_hours?: number
}

interface CalendarioClientProps {
  initialEvents: Event[]
  initialMaterias: Materia[]
  initialDayContext: DayContext | null
}

export default function CalendarioClient({
  initialEvents,
  initialMaterias,
  initialDayContext
}: CalendarioClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [materias, setMaterias] = useState<Materia[]>(initialMaterias)
  const [dayContext, setDayContext] = useState<DayContext | null>(initialDayContext)
  const [dismissedSuggestionDate, setDismissedSuggestionDate] = useState<string | null>(null)
  const [isPendingContext, startTransition] = useTransition()
  const { toast } = useToast()
  
  // Modal de Evento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalData, setModalData] = useState({
    activityType: 'Estudo' as ActivityType,
    title: '',
    time: '',
    duration: '',
    subjectId: ''
  })
  
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [isDeletingEvent, setIsDeletingEvent] = useState(false)
  
  // Modal de Duplicação
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [selectedEventsToDuplicate, setSelectedEventsToDuplicate] = useState<string[]>([])
  const [repeatFuture, setRepeatFuture] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const formatDateStr = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const selectedDateStr = formatDateStr(selectedDate)

  const refreshDayContext = (dateStr: string) => {
    startTransition(async () => {
      const res = await getDayContext(dateStr)
      if (res.success && res.data) {
        setDayContext(res.data)
      }
    })
  }

  const selectDate = (date: Date) => {
    setSelectedDate(date)
    setDayContext(null)
    refreshDayContext(formatDateStr(date))
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear()
  }

  const getEventsForDate = (date: Date) => {
    const dateString = formatDateStr(date)
    return events.filter(event => event.event_date && event.event_date.startsWith(dateString))
  }

  const getEventsForSelectedDate = () => {
    return getEventsForDate(selectedDate)
  }

  const toggleEventDone = async (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (event) {
      const result = await toggleEventStatus(eventId, !event.is_done)
      if (result.success) {
        setEvents(events.map(e =>
          e.id === eventId ? { ...e, is_done: !e.is_done } : e
        ))
        refreshDayContext(selectedDateStr)
      }
    }
  }

  const openModal = () => {
    setIsModalOpen(true)
    setModalData({
      activityType: 'Estudo',
      title: '',
      time: '',
      duration: '',
      subjectId: ''
    })
    setEditingEventId(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEventId(null)
    setOpenDropdownId(null)
  }

  const saveEvent = async () => {
    const eventDate = selectedDateStr
    const finalSubjectId = modalData.subjectId

    if (!modalData.title.trim() || !modalData.time || !modalData.duration) {
      toast("Por favor, preencha o nome, horário e a duração do estudo.", "error")
      return
    }

    if (modalData.activityType === 'Estudo' && !finalSubjectId) {
      toast("Por favor, selecione uma matéria.", "error")
      return
    }

    const parsedDuration = Number(modalData.duration)
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      toast("A duração deve ser um número válido maior que zero.", "error")
      return
    }

    if (editingEventId) {
      const result = await updateEvent(editingEventId, {
        title: modalData.title,
        time: modalData.time,
        duration: parsedDuration,
        subject_id: finalSubjectId || null,
        activity_type: modalData.activityType,
        event_date: eventDate
      })
      
      if (result.success) {
        if (result.event) {
          setEvents(events.map(event => event.id === editingEventId ? result.event : event))
        } else {
          const dataResult = await getCalendarData()
          if (!dataResult.error) {
            setEvents(dataResult.events || [])
          }
        }
        closeModal()
        refreshDayContext(selectedDateStr)
        toast("Estudo atualizado com sucesso!", "success")
      } else {
        toast("Erro ao atualizar o estudo: " + result.error, "error")
      }
    } else {
      const result = await createEvent({
        title: modalData.title,
        time: modalData.time,
        duration: parsedDuration,
        subject_id: finalSubjectId || null,
        activity_type: modalData.activityType,
        event_date: eventDate
      })
      
      if (result.success) {
        if (result.event) {
          setEvents([...events, result.event])
        } else {
          const dataResult = await getCalendarData()
          if (!dataResult.error) {
            setEvents(dataResult.events || [])
          }
        }
        closeModal()
        refreshDayContext(selectedDateStr)
        toast("Estudo adicionado ao calendário!", "success")
      } else {
        toast("Erro ao criar o estudo: " + result.error, "error")
      }
    }
  }

  const editEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (event) {
      setModalData({
        activityType: event.activity_type || 'Estudo',
        title: event.title,
        time: event.time,
        duration: event.duration.toString(),
        subjectId: event.subject_id || ''
      })
      setEditingEventId(eventId)
      setIsModalOpen(true)
      setOpenDropdownId(null)
    }
  }

  const executeDeleteEvent = async () => {
    if (!eventToDelete) return
    setIsDeletingEvent(true)
    const result = await deleteEventAction(eventToDelete)
    if (result.success) {
      setEvents(events.filter(event => event.id !== eventToDelete))
      setOpenDropdownId(null)
      refreshDayContext(selectedDateStr)
      toast("Estudo excluído com sucesso!", "success")
    } else {
      toast("Erro ao excluir estudo.", "error")
    }
    setIsDeletingEvent(false)
    setEventToDelete(null)
  }

  const deleteEvent = (eventId: string) => {
    setEventToDelete(eventId)
  }

  const openDuplicateModal = () => {
    const dayEvents = getEventsForSelectedDate()
    setSelectedEventsToDuplicate(dayEvents.map(e => e.id))
    setRepeatFuture(false)
    setIsDuplicateModalOpen(true)
  }

  const closeDuplicateModal = () => setIsDuplicateModalOpen(false)

  const handleDuplicate = async () => {
    if (selectedEventsToDuplicate.length === 0) return
    setIsDuplicating(true)
    
    const dateStr = selectedDateStr
    const result = await duplicateEvents(selectedEventsToDuplicate, dateStr, repeatFuture)
    
    if (result.success) {
      const dataResult = await getCalendarData()
      if (!dataResult.error) {
        setEvents(dataResult.events || [])
      }
      closeDuplicateModal()
      refreshDayContext(selectedDateStr)
      toast("Cronograma sincronizado com sucesso!", "success")
    } else {
      toast("Erro ao duplicar cronograma: " + result.error, "error")
    }
    
    setIsDuplicating(false)
  }

  const handleApplySuggestion = (sugestao: SugestaoDia) => {
    const durationMinutes = Math.round(sugestao.duracaoSugerida * 60)
    setModalData({
      activityType: 'Estudo',
      title: `Estudo ${sugestao.materiaNome}`,
      time: '09:00',
      duration: durationMinutes.toString(),
      subjectId: sugestao.materiaId
    })
    setEditingEventId(null)
    setIsModalOpen(true)
  }

  const handleDismissSuggestion = () => {
    setDismissedSuggestionDate(selectedDateStr)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedDate)
    const diff = i - date.getDay()
    date.setDate(date.getDate() + diff)
    return date
  })

  const sugestaoCalculada = gerarSugestaoDoDia(dayContext)
  const isSuggestionDismissed = dismissedSuggestionDate === selectedDateStr
  const sugestaoVisivel = sugestaoCalculada && !isSuggestionDismissed
  const examDate = dayContext?.examGoal?.target_date?.slice(0, 10)
  const examDaysRemaining = examDate
    ? Math.ceil((Date.parse(`${examDate}T12:00:00Z`) - Date.parse(`${formatDateStr(new Date())}T12:00:00Z`)) / 86400000)
    : null

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Planejamento</h1>
            <p className="text-slate-500 mt-2">Organize seu cronograma de estudos com inteligência</p>
          </div>
          <div className="flex w-full md:w-auto">
            <div className="bg-white rounded-2xl px-5 py-3 border border-slate-200 shadow-sm flex items-center gap-4 w-full md:w-auto">
              <div className="bg-primary-100 p-2 rounded-xl text-primary-700">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Disponibilidade do Dia</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {dayContext ? `${dayContext.disponibilidadeDia}h no seu plano` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {dayContext?.examGoal?.name && examDaysRemaining !== null && Number.isFinite(examDaysRemaining) && (
          <p className="text-sm text-slate-500 mb-6">
            Objetivo: <span className="font-semibold text-slate-700">{dayContext.examGoal.name}</span>
            {' · '}{examDaysRemaining > 0 ? `${examDaysRemaining} dias para a prova` : examDaysRemaining === 0 ? 'prova hoje' : 'data da prova já passou'}
          </p>
        )}

        {isPendingContext && <p className="mb-4 text-sm text-slate-600" role="status">Carregando dados do dia...</p>}

        {/* Grade do Calendário e Coluna Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <button onClick={goToPreviousMonth} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="text-xl font-bold text-slate-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button onClick={goToNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <button
                onClick={() => {
                  const now = new Date()
                  setCurrentDate(now)
                  selectDate(now)
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
              >
                Hoje
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mt-4">
              {dayNames.map(day => (
                <div key={day} className="text-xs font-bold uppercase text-center text-slate-900">
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentDate).map((date, index) => {
                if (!date) return <div key={index} className="aspect-square" />

                const today = isToday(date)
                const selected = isSelected(date)
                const dayEvents = getEventsForDate(date)
                const displayEvents = dayEvents.slice(0, 3) 

                return (
                  <button
                    key={index}
                    onClick={() => selectDate(date)}
                    className={`h-10 w-10 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer mx-auto ${
                      selected 
                        ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700' 
                        : 'hover:bg-slate-100'
                    } ${today && !selected ? 'text-primary-600 font-bold' : ''}`}
                  >
                    <span className="text-sm">{date.getDate()}</span>
                    {displayEvents.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {displayEvents.map((event, idx) => (
                          <div key={idx} className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            
            {/* Contexto Resumido do Dia Selecionado */}
            {dayContext && (
              <div className="bg-white border border-slate-200 p-4 rounded-2xl mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-primary-600 shrink-0" />
                  <p className="text-sm font-medium text-slate-700">
                    Para este dia: <strong className="text-slate-900">{dayContext.disponibilidadeDia}h</strong> disponíveis,{' '}
                    <strong className="text-slate-900">{dayContext.jaAgendadoDia}h</strong> planejadas,{' '}
                    <strong className="text-slate-900">{dayContext.jaEstudadoDia}h</strong> estudadas.
                  </p>
                </div>
                <span className="text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-lg shrink-0">
                  {dayContext.espacoLivre}h livres para planejar
                </span>
              </div>
            )}

            {/* Cartão de Sugestão Inteligente (Meu Plano) */}
            {sugestaoVisivel && (
              <div className="mb-6 p-5 border-2 border-dashed border-primary-300 bg-primary-50/50 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="bg-primary-100 p-2.5 rounded-2xl text-primary-700 shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary-700">Sugestão do Meu Plano</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-primary-700 border border-primary-200 px-2 py-0.5 rounded-md">
                        {sugestaoCalculada.motivoTexto}
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">
                      {sugestaoCalculada.materiaNome} ({sugestaoCalculada.duracaoSugerida}h sugeridas)
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Encaixe ideal para bater a meta semanal com base no espaço livre de hoje.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    onClick={handleDismissSuggestion}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-white/60 rounded-xl transition"
                  >
                    Dispensar
                  </button>
                  <button
                    onClick={() => handleApplySuggestion(sugestaoCalculada)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    Adicionar ao calendário
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Minha semana</h2>
                <p className="text-slate-500 text-sm mt-1">O que você tem planejado pros próximos dias</p>
              </div>
              <div className="flex gap-2">
                {getEventsForSelectedDate().length > 0 && (
                  <button
                    onClick={openDuplicateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition shadow-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicar
                  </button>
                )}
                <button
                  onClick={openModal}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar estudo
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              {weekDays.map((date, index) => {
                const isCurrentDay = date.getDate() === selectedDate.getDate() &&
                                     date.getMonth() === selectedDate.getMonth() &&
                                     date.getFullYear() === selectedDate.getFullYear()
                
                return (
                  <button
                    key={index}
                    onClick={() => selectDate(date)}
                    className={`flex-1 py-3 rounded-2xl text-center font-medium transition-all ${
                      isCurrentDay
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div className="text-xs">{dayNames[date.getDay()]}</div>
                    <div className="text-lg font-bold">{date.getDate()}</div>
                  </button>
                )
              })}
            </div>

            <div className="space-y-3">
              {getEventsForSelectedDate().length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
                  <p className="text-slate-500 font-medium">Nada marcado por aqui ainda</p>
                </div>
              ) : (
                getEventsForSelectedDate().map(event => {
                  const materia = materias.find(m => m.id === event.subject_id)
                  return (
                    <div
                      key={event.id}
                      className="animate-enter bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 relative shadow-sm"
                    >
                      <div className="flex flex-col items-center min-w-[60px]">
                        <span className="text-slate-900 font-bold">{event.time}</span>
                        <span className="text-slate-400 text-xs">{formatDuration(event.duration)}</span>
                      </div>

                      <AsyncButton
                        onClick={() => toggleEventDone(event.id)}
                        pendingText="Atualizando..."
                        iconOnly
                        aria-label={event.is_done ? 'Marcar como pendente' : 'Concluir estudo'}
                        className={`w-6 h-6 border-2 rounded-lg flex-shrink-0 cursor-pointer flex items-center justify-center ${
                          event.is_done
                            ? 'border-emerald-500 flex items-center justify-center'
                            : 'border-slate-300'
                        }`}
                      >
                        {event.is_done && <Check className="text-emerald-500 w-4 h-4 stroke-[3]" />}
                      </AsyncButton>

                      <div className="flex-1">
                        <p className={`font-semibold ${event.is_done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {event.title}
                        </p>
                        <span className="text-xs text-slate-500">{event.activity_type || 'Estudo'}</span>
                      </div>

                      {materia && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                          {materia.name}
                        </span>
                      )}

                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === event.id ? null : event.id)}
                          className="p-2 text-slate-400 hover:text-slate-600"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openDropdownId === event.id && (
                          <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-lg py-2 w-32 z-10">
                            <button
                              onClick={() => editEvent(event.id)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal de Criação / Edição de Evento */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-overlay">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-modal">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingEventId ? 'Editar Estudo' : 'Novo Estudo'}
                </h3>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de atividade</label>
                  <select
                    value={modalData.activityType}
                    onChange={(e) => setModalData({ ...modalData, activityType: e.target.value as ActivityType })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    {(['Estudo', 'Revisão', 'Simulado', 'Redação', 'Outro'] as ActivityType[]).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Título da atividade
                  </label>
                  <input
                    type="text"
                    value={modalData.title}
                    onChange={(e) => setModalData({ ...modalData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Revisão de funções"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    value={modalData.time}
                    onChange={(e) => setModalData({ ...modalData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duração (em minutos)
                  </label>
                  <input
                    type="number"
                    value={modalData.duration}
                    onChange={(e) => setModalData({ ...modalData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: 90"
                  />
                  {modalData.duration && !isNaN(parseInt(modalData.duration)) && (
                    <p className="text-primary-600 text-sm mt-1">
                      Equivale a {formatDuration(parseInt(modalData.duration))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Matéria {modalData.activityType !== 'Estudo' && '(opcional)'}
                  </label>
                  <select
                    value={modalData.subjectId}
                    onChange={(e) => setModalData({ ...modalData, subjectId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{modalData.activityType === 'Estudo' ? 'Selecione uma matéria' : 'Sem matéria'}</option>
                    {materias.map(materia => (
                      <option key={materia.id} value={materia.id}>
                        {materia.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <AsyncButton
                  onClick={saveEvent}
                  pendingText={editingEventId ? 'Salvando...' : 'Criando...'}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition"
                >
                  Salvar
                </AsyncButton>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Duplicação de Estudos */}
        {isDuplicateModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-overlay">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-modal">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">Sincronizar Cronograma</h3>
                <button onClick={closeDuplicateModal} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              
              <p className="text-sm text-slate-500 mb-6">
                Selecione quais estudos do dia <strong className="text-slate-700">{selectedDate.toLocaleDateString('pt-BR')}</strong> você deseja copiar para a próxima semana.
              </p>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-1">
                {getEventsForSelectedDate().map(event => (
                  <label key={event.id} className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                    <input 
                      type="checkbox" 
                      checked={selectedEventsToDuplicate.includes(event.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEventsToDuplicate([...selectedEventsToDuplicate, event.id])
                        } else {
                          setSelectedEventsToDuplicate(selectedEventsToDuplicate.filter(id => id !== event.id))
                        }
                      }}
                      className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" 
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700 text-sm">{event.title}</p>
                      <p className="text-slate-400 text-xs">{event.time} • {formatDuration(event.duration)}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl mb-6 border border-primary-100">
                <div className="flex-1">
                  <p className="font-semibold text-primary-900 text-sm">Manter nas próximas semanas</p>
                  <p className="text-primary-700 text-xs mt-0.5">
                    Repete este cronograma para as próximas 4 semanas.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={repeatFuture} 
                    onChange={(e) => setRepeatFuture(e.target.checked)} 
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:text-primary-600"></div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeDuplicateModal}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <AsyncButton
                  onClick={handleDuplicate}
                  pendingText="Sincronizando..."
                  disabled={selectedEventsToDuplicate.length === 0 || isDuplicating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
                >
                  Sincronizar
                </AsyncButton>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <ConfirmModal
        isOpen={!!eventToDelete}
        title="Excluir Estudo"
        message="Tem certeza que deseja remover este estudo do seu calendário?"
        confirmText="Sim, excluir"
        onConfirm={executeDeleteEvent}
        onCancel={() => setEventToDelete(null)}
        isLoading={isDeletingEvent}
      />
    </div>
  )
}
