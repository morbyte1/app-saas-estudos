'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Clock, Plus, MoreVertical, Check, X, Copy, Edit2, Target } from 'lucide-react'
import {
  getCalendarData,
  createEvent,
  updateEvent,
  deleteEvent as deleteEventAction,
  toggleEventStatus,
  createSubject,
  duplicateEvents
} from './actions'
import { getDashboardStats, updateDailyGoal } from '../actions'

interface Event {
  id: string
  title: string
  time: string
  duration: number
  subject_id: string
  is_done: boolean
  event_date: string
}

interface Subject {
  id: string
  name: string
  color: string
}

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [dailyStats, setDailyStats] = useState({ goal: 3, todayMinutes: 0 })
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal de Evento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalData, setModalData] = useState({
    title: '',
    time: '',
    duration: '',
    subjectId: '',
    newSubjectName: '',
    newSubjectColor: '#8b5cf6'
  })
  const [showNewSubject, setShowNewSubject] = useState(false)
  const [isSavingSubject, setIsSavingSubject] = useState(false)
  
  // Modal de Duplicação
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [selectedEventsToDuplicate, setSelectedEventsToDuplicate] = useState<string[]>([])
  const [repeatFuture, setRepeatFuture] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  // Modal de Meta Diária
  const [isDailyGoalModalOpen, setIsDailyGoalModalOpen] = useState(false)
  const [newDailyGoal, setNewDailyGoal] = useState('')

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const [result, statsResult] = await Promise.all([
        getCalendarData(),
        getDashboardStats()
      ])
      
      if (!result.error) {
        setEvents(result.events || [])
        setSubjects(result.subjects || [])
      }
      
      if (statsResult?.success && statsResult.data) {
        setDailyStats({
          goal: statsResult.data.dailyGoalHours,
          todayMinutes: statsResult.data.todayMinutes
        })
      }
      
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const selectDate = (date: Date) => {
    setSelectedDate(date)
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
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    
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
      }
    }
  }

  const openModal = () => {
    setIsModalOpen(true)
    setModalData({
      title: '',
      time: '',
      duration: '',
      subjectId: subjects.length > 0 ? subjects[0].id : '',
      newSubjectName: '',
      newSubjectColor: '#8b5cf6'
    })
    setShowNewSubject(false)
    setEditingEventId(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEventId(null)
    setOpenDropdownId(null)
  }

  const handleSaveSubject = async () => {
    if (!modalData.newSubjectName.trim()) return
    setIsSavingSubject(true)
    
    try {
      const result = await createSubject({
        name: modalData.newSubjectName,
        color: modalData.newSubjectColor
      })
      
      if (result.success) {
        const dataResult = await getCalendarData()
        
        if (!dataResult.error) {
          setSubjects(dataResult.subjects || [])
          
          const createdSubject = result.subject || dataResult.subjects?.find((s: Subject) => s.name === modalData.newSubjectName)
          
          setModalData(prev => ({ 
            ...prev, 
            subjectId: createdSubject ? createdSubject.id : (dataResult.subjects?.[0]?.id || ''), 
            newSubjectName: '',
            newSubjectColor: '#8b5cf6'
          }))
        }
        setShowNewSubject(false)
      } else {
        alert('Não foi possível criar a matéria/tag. Detalhe do erro: ' + result.error)
      }
    } catch (err) {
      alert('Erro inesperado ao tentar salvar a matéria.')
    } finally {
      setIsSavingSubject(false)
    }
  }

  const saveEvent = async () => {
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
    const eventDate = `${year}-${month}-${day}`
    
    const finalSubjectId = modalData.subjectId

    if (!modalData.title.trim() || !modalData.time || !modalData.duration) {
      alert("Por favor, preencha o nome, horário e a duração do estudo.")
      return
    }

    if (!finalSubjectId) {
      alert("Por favor, selecione ou crie uma matéria (tag).")
      return
    }

    const parsedDuration = parseInt(modalData.duration)
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      alert("A duração deve ser um número válido maior que zero.")
      return
    }

    if (editingEventId) {
      const result = await updateEvent(editingEventId, {
        title: modalData.title,
        time: modalData.time,
        duration: parsedDuration,
        subject_id: finalSubjectId,
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
      } else {
        alert("Erro ao atualizar o estudo: " + result.error)
      }
    } else {
      const result = await createEvent({
        title: modalData.title,
        time: modalData.time,
        duration: parsedDuration,
        subject_id: finalSubjectId,
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
      } else {
        alert("Erro ao criar o estudo no banco de dados: " + result.error)
      }
    }
  }

  const editEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (event) {
      setModalData({
        title: event.title,
        time: event.time,
        duration: event.duration.toString(),
        subjectId: event.subject_id,
        newSubjectName: '',
        newSubjectColor: '#8b5cf6'
      })
      setShowNewSubject(false)
      setEditingEventId(eventId)
      setIsModalOpen(true)
      setOpenDropdownId(null)
    }
  }

  const deleteEvent = async (eventId: string) => {
    const result = await deleteEventAction(eventId)
    if (result.success) {
      setEvents(events.filter(event => event.id !== eventId))
      setOpenDropdownId(null)
    }
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
    
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const result = await duplicateEvents(selectedEventsToDuplicate, dateStr, repeatFuture)
    
    if (result.success) {
      const dataResult = await getCalendarData()
      if (!dataResult.error) {
        setEvents(dataResult.events || [])
      }
      closeDuplicateModal()
    } else {
      alert("Erro ao duplicar cronograma: " + result.error)
    }
    
    setIsDuplicating(false)
  }

  const handleSaveDailyGoal = async () => {
    const num = parseFloat(newDailyGoal)
    if (isNaN(num) || num <= 0) {
      alert("Informe um número de horas válido.")
      return
    }
    const result = await updateDailyGoal(num)
    if (result.success) {
      setDailyStats(prev => ({ ...prev, goal: num }))
      setIsDailyGoalModalOpen(false)
    } else {
      alert("Erro ao salvar meta.")
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }

  const getSubjectColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-primary-100 text-primary-700', blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700', orange: 'bg-orange-100 text-orange-700', red: 'bg-red-100 text-red-700'
    }
    if (color && color.startsWith('#')) return { backgroundColor: color + '20', color: color }
    return colors[color || 'purple'] || colors.purple
  }

  const getSubjectDotColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-primary-400', blue: 'bg-blue-400', green: 'bg-green-400', orange: 'bg-orange-400', red: 'bg-red-400'
    }
    if (color && color.startsWith('#')) return '' 
    return colors[color || 'purple'] || colors.purple
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedDate)
    const diff = i - date.getDay()
    date.setDate(date.getDate() + diff)
    return date
  })

  // Formatadores de Meta Diária
  const formatDecimal = (mins: number) => (mins / 60).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  
  const studiedDec = formatDecimal(dailyStats.todayMinutes)
  const remainingMinutes = Math.max((dailyStats.goal * 60) - dailyStats.todayMinutes, 0)
  const remH = Math.floor(remainingMinutes / 60)
  const remM = remainingMinutes % 60

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Carregando...</div>
          </div>
        ) : (
          <>
<div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Planejamento</h1>
                <p className="text-slate-500 mt-2">Organize seu cronograma de estudos</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-white rounded-full px-5 py-2.5 border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="flex items-center gap-3 border-r border-slate-100 pr-4">
                    <div className="bg-primary-100 p-1.5 rounded-full">
                      <Target className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Minha meta do dia</span>
                      <span className="text-sm font-bold text-slate-700 leading-none">{studiedDec}h / {dailyStats.goal}h</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setNewDailyGoal(dailyStats.goal.toString())
                      setIsDailyGoalModalOpen(true)
                    }} 
                    className="text-slate-400 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 p-1.5 rounded-full transition"
                    title="Editar meta diária"
                  >
                    <Edit2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
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
                      setCurrentDate(new Date())
                      setSelectedDate(new Date())
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
                            {displayEvents.map((event, idx) => {
                              const subject = subjects.find(s => s.id === event.subject_id)
                              const isHex = subject?.color?.startsWith('#')
                              
                              return (
                                <div 
                                  key={idx}
                                  className={`w-1.5 h-1.5 rounded-full ${isHex ? '' : getSubjectDotColorClass(subject?.color || 'purple')}`}
                                  style={isHex ? { backgroundColor: subject!.color } : {}}
                                />
                              )
                            })}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="lg:col-span-2">
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
                            ? 'bg-primary-600 text-white'
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
                      <p className="text-slate-500">Nada marcado por aqui ainda</p>
                    </div>
                  ) : (
                    getEventsForSelectedDate().map(event => {
                      const subject = subjects.find(s => s.id === event.subject_id)
                      return (
                        <div
                          key={event.id}
                          className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 relative"
                        >
                          <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-slate-900 font-bold">{event.time}</span>
                            <span className="text-slate-400 text-xs">{formatDuration(event.duration)}</span>
                          </div>

                          <div
                            onClick={() => toggleEventDone(event.id)}
                            className={`w-6 h-6 border-2 rounded-lg flex-shrink-0 cursor-pointer ${
                              event.is_done
                                ? 'border-emerald-500 flex items-center justify-center'
                                : 'border-slate-300'
                            }`}
                          >
                            {event.is_done && <Check className="text-emerald-500 w-4 h-4 stroke-[3]" />}
                          </div>

                          <div className="flex-1">
                            <p className={`font-semibold ${event.is_done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {event.title}
                            </p>
                          </div>

                          {subject && (
                            <span
                              className={
                                subject.color && subject.color.startsWith('#')
                                  ? 'px-3 py-1 rounded-full text-xs font-medium'
                                  : `px-3 py-1 rounded-full text-xs font-medium ${getSubjectColorClass(subject.color)}`
                              }
                              style={
                                subject.color && subject.color.startsWith('#')
                                  ? { backgroundColor: subject.color + '20', color: subject.color }
                                  : {}
                              }
                            >
                              {subject.name}
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

            {/* Modal de Evento */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
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
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nome do Estudo
                      </label>
                      <input
                        type="text"
                        value={modalData.title}
                        onChange={(e) => setModalData({ ...modalData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Ex: Estudo Matemática"
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
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Tags
                        </label>
                        {!showNewSubject && (
                          <button
                            type="button"
                            onClick={() => setShowNewSubject(true)}
                            className="text-primary-600 text-xs font-bold flex items-center gap-1 hover:text-primary-700"
                          >
                            <Plus className="w-3 h-3" /> Nova Tag
                          </button>
                        )}
                      </div>
                      
                      {!showNewSubject ? (
                        <select
                          value={modalData.subjectId}
                          onChange={(e) => setModalData({ ...modalData, subjectId: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="" disabled>Selecione uma matéria</option>
                          {subjects.map(subject => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-3 bg-primary-50 border border-primary-100 p-4 rounded-xl">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-primary-900">Criação de tags</h4>
                            <button type="button" onClick={() => setShowNewSubject(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Nome
                            </label>
                            <input
                              type="text"
                              value={modalData.newSubjectName}
                              onChange={(e) => setModalData({ ...modalData, newSubjectName: e.target.value })}
                              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                              placeholder="Ex: Biologia"
                            />
                          </div>
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-700 mb-1">
                                Cor
                              </label>
                              <input
                                type="color"
                                value={modalData.newSubjectColor}
                                onChange={(e) => setModalData({ ...modalData, newSubjectColor: e.target.value })}
                                className="w-full h-10 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleSaveSubject}
                              disabled={!modalData.newSubjectName.trim() || isSavingSubject}
                              className="px-4 py-2 h-10 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
                            >
                              {isSavingSubject ? 'Salvando...' : 'Salvar'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveEvent}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Duplicação de Estudos */}
            {isDuplicateModalOpen && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
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
                    <button
                      onClick={handleDuplicate}
                      disabled={selectedEventsToDuplicate.length === 0 || isDuplicating}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
                    >
                      {isDuplicating ? 'Sincronizando...' : 'Sincronizar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Meta Diária */}
            {isDailyGoalModalOpen && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Configurar Meta Diária</h3>
                    <button onClick={() => setIsDailyGoalModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                      <X className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Horas por dia</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={newDailyGoal}
                        onChange={(e) => setNewDailyGoal(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Ex: 3"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-8">
                    <button
                      onClick={() => setIsDailyGoalModalOpen(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveDailyGoal}
                      disabled={!newDailyGoal}
                      className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
                    >
                      Salvar Meta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}