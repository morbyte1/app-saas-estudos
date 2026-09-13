'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastContext'
import { Clock, Check, Edit2, AlertTriangle, Target, Save } from 'lucide-react'
import Link from 'next/link'
import { 
  salvarDisponibilidade, 
  salvarFrequenciaRedacao, 
  ajustarHorasManualMateria, 
  aplicarDistribuicaoAsMateriasGoalHours 
} from './actions'

interface Distribuicao {
  id: string
  name: string
  horasSugeridas: number
  horasManuais: number | null
  motivoTexto: string
  weeklyStudiedHours: number
  goalHoursAtual: number
}

interface MeuPlanoClientProps {
  initialData: {
    settings: any
    distribuicao: Distribuicao[]
    cursoId: string | null
    sugestaoRedacao: number
    totalHorasDisponiveis: number
    horasRedacaoSemana: number
  }
}

export default function MeuPlanoClient({ initialData }: MeuPlanoClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [horasDias, setHorasDias] = useState(initialData.settings.horas_dias_semana)
  const [horasSabado, setHorasSabado] = useState(initialData.settings.horas_sabado)
  const [horasDomingo, setHorasDomingo] = useState(initialData.settings.horas_domingo)
  
  const [frequenciaRedacao, setFrequenciaRedacao] = useState(initialData.settings.redacao_frequencia_semanal)
  const [editingMateriaId, setEditingMateriaId] = useState<string | null>(null)
  const [editHorasValue, setEditHorasValue] = useState<string>('')

  const totalCalculado = (horasDias * 5) + horasSabado + horasDomingo
  const totalAlocado = initialData.distribuicao.reduce((acc, d) => acc + d.horasSugeridas, 0)
  const isOverAllocated = totalAlocado > totalCalculado

  const materiasSemNivel = initialData.distribuicao.filter(d => d.motivoTexto.includes('Não avaliado'))
  
  const jaAplicado = initialData.distribuicao.every(d => 
    d.goalHoursAtual === (d.horasManuais !== null ? d.horasManuais : d.horasSugeridas)
  )

  const handleSaveAvailability = () => {
    startTransition(async () => {
      const res = await salvarDisponibilidade({ horasDiasSemana: horasDias, horasSabado, horasDomingo })
      if (res.success) {
        toast('Disponibilidade salva com sucesso!', 'success')
        router.refresh()
      } else {
        toast('Erro ao salvar disponibilidade.', 'error')
      }
    })
  }

  const handleSaveRedacao = () => {
    startTransition(async () => {
      const res = await salvarFrequenciaRedacao(frequenciaRedacao)
      if (res.success) {
        toast('Frequência de redação salva!', 'success')
        router.refresh()
      } else {
        toast('Erro ao salvar frequência.', 'error')
      }
    })
  }

  const handleSaveManualOverride = (materiaId: string) => {
    startTransition(async () => {
      const val = editHorasValue.trim() === '' ? null : Number(editHorasValue)
      const res = await ajustarHorasManualMateria(materiaId, val)
      if (res.success) {
        toast('Horas ajustadas!', 'success')
        setEditingMateriaId(null)
        router.refresh()
      } else {
        toast('Erro ao ajustar horas.', 'error')
      }
    })
  }

  const handleApplyToPlan = () => {
    startTransition(async () => {
      const payload: Record<string, number> = {}
      initialData.distribuicao.forEach(d => {
        payload[d.id] = d.horasManuais !== null ? d.horasManuais : d.horasSugeridas
      })
      
      const res = await aplicarDistribuicaoAsMateriasGoalHours(payload)
      if (res.success) {
        toast('Distribuição aplicada nas suas metas com sucesso!', 'success')
        router.refresh()
      } else {
        toast('Erro ao aplicar distribuição.', 'error')
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Meu Plano</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Calcule a melhor distribuição de horas baseada no peso do seu curso e sua facilidade na matéria.</p>
        </div>

        {/* Bloco Disponibilidade */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 justify-between items-start md:items-end">
          <div className="flex-1 space-y-4 w-full">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" /> Minha Disponibilidade
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Dias de Semana</label>
                <input type="number" step="0.5" min="0" value={horasDias} onChange={e => setHorasDias(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Sábados</label>
                <input type="number" step="0.5" min="0" value={horasSabado} onChange={e => setHorasSabado(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Domingos</label>
                <input type="number" step="0.5" min="0" value={horasDomingo} onChange={e => setHorasDomingo(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
            <div className="bg-primary-50 border border-primary-100 px-5 py-3 rounded-2xl text-center">
              <span className="block text-[10px] text-primary-600 font-bold uppercase tracking-wider mb-0.5">Total Semanal</span>
              <span className="text-2xl font-extrabold text-primary-700">{totalCalculado}h</span>
            </div>
            <button onClick={handleSaveAvailability} disabled={isPending} className="w-full px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm disabled:opacity-50">
              Salvar Disponibilidade
            </button>
          </div>
        </div>

        {/* Bloco Distribuição Sugerida */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" /> Distribuição Sugerida
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">As horas ideais para bater a meta sem negligenciar suas dificuldades.</p>
            </div>
          </div>

          <div className="space-y-3">
            {!initialData.cursoId && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Defina seu curso em Objetivo para receber uma distribuição mais precisa baseada em prioridade.</p>
                  <Link href="/dashboard/objetivo" className="text-xs font-bold text-amber-700 hover:underline mt-1 inline-block">Ir para Objetivo →</Link>
                </div>
              </div>
            )}
            
            {materiasSemNivel.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Algumas matérias ainda não têm nível avaliado, o que reduz a precisão da distribuição: {materiasSemNivel.map(m => m.name).join(', ')}.</p>
                  <Link href="/dashboard/objetivo" className="text-xs font-bold text-amber-700 hover:underline mt-1 inline-block">Avaliar agora →</Link>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {initialData.distribuicao.map(d => (
              <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 bg-slate-50/50 rounded-2xl hover:border-primary-100 transition-colors gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-base">{d.name}</h3>
                    {d.horasManuais !== null && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-md uppercase">(Ajustado Manualmente)</span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-2.5 py-1 rounded-md tracking-wider uppercase">
                    {d.motivoTexto}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  {editingMateriaId === d.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        step="0.5"
                        value={editHorasValue}
                        onChange={e => setEditHorasValue(e.target.value)}
                        placeholder="Automático"
                        className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary-500"
                      />
                      <button onClick={() => handleSaveManualOverride(d.id)} disabled={isPending} className="p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-lg font-extrabold text-slate-900 leading-tight">{d.horasSugeridas}h</span>
                        <span className="block text-[10px] font-semibold text-slate-400">/ semana</span>
                      </div>
                      <button onClick={() => { setEditingMateriaId(d.id); setEditHorasValue(d.horasManuais !== null ? String(d.horasManuais) : '') }} className="p-2 text-slate-400 hover:text-primary-600 bg-white border border-slate-200 hover:border-primary-200 rounded-lg transition shadow-sm">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloco Redação */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Frequência de Redação</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">A recomendação baseada no seu curso é de <strong className="text-primary-600">{initialData.sugestaoRedacao}x por semana</strong>.</p>
            <p className="text-xs text-slate-400 mt-1">Estimativa de 1h por redação, descontada do seu tempo total disponível.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input type="number" min="0" value={frequenciaRedacao} onChange={e => setFrequenciaRedacao(Number(e.target.value))} className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 text-center" />
            <button onClick={handleSaveRedacao} disabled={isPending} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm disabled:opacity-50">
              Salvar
            </button>
          </div>
        </div>

        {/* Resumo e Ação Final */}
        <div className="bg-primary-900 text-white rounded-3xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 opacity-30 rounded-full blur-[60px] pointer-events-none"></div>
          
          <div className="relative z-10 w-full md:w-auto flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-primary-200 uppercase tracking-wider">Alocação de Tempo</span>
              <span className={`text-sm font-bold ${isOverAllocated ? 'text-red-400' : 'text-white'}`}>{totalAlocado}h / {totalCalculado}h</span>
            </div>
            <div className="w-full bg-primary-800 rounded-full h-2.5 overflow-hidden">
              <div className={`h-2.5 rounded-full transition-all duration-500 ${isOverAllocated ? 'bg-red-400' : 'bg-primary-400'}`} style={{ width: `${Math.min((totalAlocado / totalCalculado) * 100, 100)}%` }}></div>
            </div>
            <span className="text-[10px] text-primary-300 mt-1 block">Inclui {initialData.horasRedacaoSemana}h reservadas para Redação</span>
            {isOverAllocated && (
              <p className="text-xs text-red-300 font-semibold mt-2">Você distribuiu mais horas do que a sua disponibilidade semanal.</p>
            )}
          </div>

          <div className="relative z-10 w-full md:w-auto flex flex-col items-end shrink-0">
            <button 
              onClick={handleApplyToPlan} 
              disabled={isPending || jaAplicado} 
              className="w-full md:w-auto px-8 py-3.5 bg-white text-primary-900 font-bold rounded-xl hover:bg-primary-50 transition shadow-sm disabled:opacity-75 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> {isPending ? 'Aplicando...' : (jaAplicado ? 'Plano já aplicado' : 'Aplicar ao meu plano')}
            </button>
            {initialData.settings.updated_at && (
              <span className="text-[10px] text-primary-300 font-medium mt-2">
                Última atualização: {new Date(initialData.settings.updated_at).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}