'use client'

import { useState } from 'react'
import { ChevronRight, Clock, Book, FileText, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/ToastContext'
import { deleteTimerSession } from '../timer/actions'

interface StudySession {
  id: string
  duration_seconds: number
  questions_total?: number
  questions_done: number
  questions_wrong: number
  session_date: string
  source?: 'timer' | 'manual'
  materias?: { name: string }
  assuntos?: { name: string }
}

export default function HistoricoClient({ initialHistory }: { initialHistory: StudySession[] }) {
  const [historySessions, setHistorySessions] = useState<StudySession[]>(initialHistory)
  const [expandedDates, setExpandedDates] = useState<string[]>([])
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  const formatDateToPortuguese = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    let formatted = date.toLocaleDateString('pt-BR', options)
    return capitalize(formatted).replace('-feira', '-feira')
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const remSeconds = totalSeconds % 60
    
    if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remSeconds).padStart(2, '0')}`
    return `${String(minutes).padStart(2, '0')}:${String(remSeconds).padStart(2, '0')}`
  }

  const toggleDate = (dateStr: string) => {
    if (expandedDates.includes(dateStr)) setExpandedDates(expandedDates.filter(d => d !== dateStr))
    else setExpandedDates([...expandedDates, dateStr])
  }

  const executeDeleteSession = async () => {
    if (!sessionToDelete) return
    setIsLoading(true)
    const result = await deleteTimerSession(sessionToDelete)
    
    if (result.success) {
      setHistorySessions(prev => prev.filter(session => session.id !== sessionToDelete))
      toast("Registro excluído.", "success")
    } else {
      toast('Erro ao excluir registro: ' + result.error, "error")
    }
    setIsLoading(false)
    setSessionToDelete(null)
  }

  const handleDeleteSession = (id: string) => setSessionToDelete(id)

  const groupedHistory = historySessions.reduce((acc, session) => {
    if (!acc[session.session_date]) acc[session.session_date] = []
    acc[session.session_date].push(session)
    return acc
  }, {} as Record<string, StudySession[]>)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Histórico de Estudos</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Reveja todos os seus registros de tempo e questões</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          {Object.keys(groupedHistory).length === 0 ? (
            <div className="text-sm text-slate-500 bg-white p-10 rounded-3xl text-center border border-slate-200 flex flex-col items-center gap-3 shadow-sm">
              <Clock className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-slate-600 text-base">Você ainda não registrou nenhum estudo.</p>
              <p className="font-medium text-slate-700">Vá até o Timer ou adicione manualmente para começar a preencher seu histórico!</p>
            </div>
          ) : (
            Object.keys(groupedHistory)
              .sort((a, b) => b.localeCompare(a))
              .map(dateStr => (
              <div key={dateStr} className="flex flex-col gap-2">
                <button
                  onClick={() => toggleDate(dateStr)}
                  className="w-full flex items-center justify-between px-6 py-4 rounded-3xl border border-slate-200 hover:border-primary-600 transition-colors group bg-white shadow-sm hover:shadow"
                >
                  <span className="text-sm font-bold text-slate-700 uppercase truncate pr-4">
                    {formatDateToPortuguese(dateStr)}
                  </span>
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-primary-600 transition-transform ${expandedDates.includes(dateStr) ? 'rotate-90' : ''}`} />
                </button>
                
                {expandedDates.includes(dateStr) && (
                  <div className="flex flex-col gap-3 px-2 pb-2 mt-1">
                    {groupedHistory[dateStr].map(session => {
                        const historicoFeitas = session.questions_total !== undefined && session.questions_total !== null
                          ? session.questions_total 
                          : session.questions_done + session.questions_wrong;

                        return (
                        <div key={session.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm group relative hover:border-primary-200 transition-colors">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary-50 rounded-lg">
                                <Book className="w-5 h-5 text-primary-600" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 text-base flex items-center gap-2">
                                  {session.materias?.name || 'Sem Matéria'}
                                  {session.source === 'manual' && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded uppercase tracking-wider border border-slate-200">
                                      Manual
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-bold text-slate-700">{formatTime(session.duration_seconds)}</span>
                              </div>
                              <button 
                                onClick={() => handleDeleteSession(session.id)}
                                disabled={isLoading}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                title="Excluir estudo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="truncate">{session.assuntos?.name || 'Sem Assunto'}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-emerald-100">
                                <CheckCircle className="w-4 h-4" />
                                {historicoFeitas} TOTAIS
                              </div>
                              <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-red-100">
                                <XCircle className="w-4 h-4" />
                                {session.questions_wrong} ERRADAS
                              </div>
                            </div>
                          </div>
                        </div>
                        )
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <ConfirmModal
        isOpen={!!sessionToDelete}
        title="Excluir Registro"
        message="Tem certeza que deseja excluir este registro de estudo do seu histórico?"
        confirmText="Sim, excluir"
        onConfirm={executeDeleteSession}
        onCancel={() => setSessionToDelete(null)}
        isLoading={isLoading}
      />
    </div>
  )
}