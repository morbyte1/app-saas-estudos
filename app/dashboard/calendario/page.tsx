'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Clock, Plus, MoreVertical, Check, X } from 'lucide-react'
import {
  getCalendarData,
  createEvent,
  updateEvent,
  deleteEvent as deleteEventAction,
  toggleEventStatus,
  createSubject
} from './actions'

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
  const [isLoading, setIsLoading] = useState(true)
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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const result = await getCalendarData()
      if (!result.error) {
        setEvents(result.events || [])
        setSubjects(result.subjects || [])
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

  const hasEvents = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.some(event => event.event_date === dateString)
  }

  const getEventsForSelectedDate = () => {
    const dateString = selectedDate.toISOString().split('T')[0]
    return events.filter(event => event.event_date === dateString)
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
      subjectId: '1',
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

  const saveEvent = async () => {
    let finalSubjectId = modalData.subjectId

    if (showNewSubject && modalData.newSubjectName) {
      const result = await createSubject({
        name: modalData.newSubjectName,
        color: modalData.newSubjectColor
      })
      if (result.success && result.subject) {
        setSubjects([...subjects, result.subject])
        finalSubjectId = result.subject.id
      } else {
        console.error('Error creating subject:', result.error)
        return
      }
    }

    const eventDate = selectedDate.toISOString().split('T')[0]

    if (editingEventId) {
      const result = await updateEvent(editingEventId, {
        title: modalData.title,
        time: modalData.time,
        duration: parseInt(modalData.duration),
        subject_id: finalSubjectId,
        event_date: eventDate
      })
      if (result.success) {
        setEvents(events.map(event =>
          event.id === editingEventId
            ? {
                ...event,
                title: modalData.title,
                time: modalData.time,
                duration: parseInt(modalData.duration),
                subject_id: finalSubjectId,
                event_date: eventDate
              }
            : event
        ))
      }
    } else {
      const result = await createEvent({
        title: modalData.title,
        time: modalData.time,
        duration: parseInt(modalData.duration),
        subject_id: finalSubjectId,
        event_date: eventDate
      })
      if (result.success) {
        // Refresh data to get the new event with proper ID
        const dataResult = await getCalendarData()
        if (!dataResult.error) {
          setEvents(dataResult.events || [])
          setSubjects(dataResult.subjects || [])
        }
      }
    }

    closeModal()
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }

  const getSubjectColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-700',
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      orange: 'bg-orange-100 text-orange-700',
      red: 'bg-red-100 text-red-700'
    }

    // Check if it's a hex color
    if (color.startsWith('#')) {
      return { backgroundColor: color + '20', color: color }
    }

    return colors[color] || colors.purple
  }

  const getSelectedSubject = () => {
    return subjects.find(s => s.id === modalData.subjectId)
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedDate)
    const diff = i - date.getDay()
    date.setDate(date.getDate() + diff)
    return date
  })

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
                <h1 className="text-3xl font-extrabold text-slate-900">Meu Calendário de Estudos</h1>
                <p className="text-slate-500 mt-2">Gerencie seu cronograma de estudos</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Horas essa semana</p>
                  <p className="text-2xl font-bold text-slate-900">12h 30min</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Meta diária</p>
                  <p className="text-2xl font-bold text-slate-900">3h</p>
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
                const eventsOnDay = hasEvents(date)

                return (
                  <button
                    key={index}
                    onClick={() => selectDate(date)}
                    className={`h-10 w-10 flex flex-col items-center justify-center rounded-xl transition-all hover:bg-slate-100 cursor-pointer mx-auto ${
                      selected ? 'bg-purple-600 text-white shadow-md' : ''
                    } ${today && !selected ? 'text-purple-600 font-bold' : ''}`}
                  >
                    <span className="text-sm">{date.getDate()}</span>
                    {eventsOnDay && (
                      <div className="flex gap-1 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
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
              <h2 className="text-xl font-bold text-slate-900">Cronograma Semanal</h2>
              <p className="text-slate-500 text-sm mt-1">Seus estudos da semana</p>
            </div>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition"
            >
              <Plus className="w-4 h-4" />
              Novo Estudo
            </button>
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
                      ? 'bg-purple-600 text-white'
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
                <p className="text-slate-500">Nenhum estudo agendado para este dia</p>
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
                          subject.color.startsWith('#')
                            ? 'px-3 py-1 rounded-full text-xs font-medium'
                            : `px-3 py-1 rounded-full text-xs font-medium ${getSubjectColorClass(subject.color)}`
                        }
                        style={
                          subject.color.startsWith('#')
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

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md">
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
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duração em Minutos
                  </label>
                  <input
                    type="number"
                    value={modalData.duration}
                    onChange={(e) => setModalData({ ...modalData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: 90"
                  />
                  {modalData.duration && (
                    <p className="text-purple-600 text-sm mt-1">
                      Equivale a {formatDuration(parseInt(modalData.duration))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Matéria/Tag
                  </label>
                  <select
                    value={modalData.subjectId}
                    onChange={(e) => {
                      setShowNewSubject(e.target.value === 'new')
                      setModalData({ ...modalData, subjectId: e.target.value })
                    }}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                    {!editingEventId && <option value="new">Criar Nova Matéria</option>}
                  </select>
                </div>

                {showNewSubject && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nome da Nova Matéria
                      </label>
                      <input
                        type="text"
                        value={modalData.newSubjectName}
                        onChange={(e) => setModalData({ ...modalData, newSubjectName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: Biologia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cor
                      </label>
                      <input
                        type="color"
                        value={modalData.newSubjectColor}
                        onChange={(e) => setModalData({ ...modalData, newSubjectColor: e.target.value })}
                        className="w-12 h-10 p-0.5 border-0 rounded-md cursor-pointer"
                      />
                    </div>
                  </div>
                )}
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
                  className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md">
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
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duração em Minutos
                  </label>
                  <input
                    type="number"
                    value={modalData.duration}
                    onChange={(e) => setModalData({ ...modalData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: 90"
                  />
                  {modalData.duration && (
                    <p className="text-purple-600 text-sm mt-1">
                      Equivale a {formatDuration(parseInt(modalData.duration))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Matéria/Tag
                  </label>
                  <select
                    value={modalData.subjectId}
                    onChange={(e) => {
                      setShowNewSubject(e.target.value === 'new')
                      setModalData({ ...modalData, subjectId: e.target.value })
                    }}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                    {!editingEventId && <option value="new">Criar Nova Matéria</option>}
                  </select>
                </div>

                {showNewSubject && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nome da Nova Matéria
                      </label>
                      <input
                        type="text"
                        value={modalData.newSubjectName}
                        onChange={(e) => setModalData({ ...modalData, newSubjectName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: Biologia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cor
                      </label>
                      <input
                        type="color"
                        value={modalData.newSubjectColor}
                        onChange={(e) => setModalData({ ...modalData, newSubjectColor: e.target.value })}
                        className="w-12 h-10 p-0.5 border-0 rounded-md cursor-pointer"
                      />
                    </div>
                  </div>
                )}
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
                  className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
