'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, CheckCircle2, Target, BookOpen, 
  TrendingUp, TrendingDown, Library, Award, 
  AlertTriangle, Brain, AlertCircle,
  Book, FileQuestion
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { getRealEstatisticas } from './actions'

const errorReasons = [
  { id: 1, name: 'Falta de Atenção', percent: 45, icon: AlertCircle },
  { id: 2, name: 'Erro de Cálculo', percent: 30, icon: AlertTriangle },
  { id: 3, name: 'Erro de Conceito', percent: 25, icon: Brain },
]

export default function EstatisticasPage() {
  const [stats, setStats] = useState({
    totalDurationFormatted: '0min',
    totalQuestions: 0,
    globalPrecision: 0,
    totalTopicosFeitos: 0,
    totalErros: 0,
    destaques: {
      maisEstudada: '-',
      menosEstudada: '-',
      maisTopicos: '-',
      menosTopicos: '-',
      melhorPrecisao: '-',
      piorPrecisao: '-',
      maisQuestoes: '-',
      menosQuestoes: '-'
    },
    annualData: [] as any[],
    monthlyData: [] as any[],
    finishedTopicsData: [] as any[],
    wrongQuestionsData: [] as any[]
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true)
      const res = await getRealEstatisticas()
      if (res.success && res.data) {
        setStats(res.data)
      }
      setIsLoading(false)
    }
    loadStats()
  }, [])

  const getErrorColorClass = (percent: number) => {
    if (percent >= 40) return { bg: 'bg-red-600', text: 'text-red-700', track: 'bg-red-100' }
    if (percent >= 26 && percent <= 39) return { bg: 'bg-red-400', text: 'text-red-600', track: 'bg-red-50' }
    return { bg: 'bg-red-200', text: 'text-red-500', track: 'bg-slate-100' }
  }

  // Componente Customizado para renderizar a Semana + Período no XAxis
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const dataPoint = stats.monthlyData.find(d => d.name === payload.value)
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748b" fontSize={12} className="font-semibold">
          {payload.value}
        </text>
        {dataPoint && (
          <text x={0} y={0} dy={32} textAnchor="middle" fill="#94a3b8" fontSize={10}>
            {dataPoint.label}
          </text>
        )}
      </g>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABEÇALHO */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Estatísticas</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Acompanhe seu desempenho geral</p>
        </div>

        {/* 1. KPIs REAIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-primary-100 p-3 rounded-xl text-primary-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Tempo Total</p>
              <p className="text-2xl font-bold text-slate-900">
                {isLoading ? '...' : stats.totalDurationFormatted}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Questões Feitas</p>
              <p className="text-2xl font-bold text-slate-900">
                {isLoading ? '...' : stats.totalQuestions}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Precisão Global</p>
              <p className="text-2xl font-bold text-slate-900">
                {isLoading ? '...' : `${stats.globalPrecision}%`}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Tópicos Feitos</p>
              <p className="text-2xl font-bold text-slate-900">
                {isLoading ? '...' : stats.totalTopicosFeitos}
              </p>
            </div>
          </div>
        </div>

        {/* 2. DESTAQUES REAIS */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Destaques</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-xs text-slate-500 font-medium">Mais Estudada</span>
              <span className="text-sm font-bold text-slate-900">{isLoading ? '...' : stats.destaques.maisEstudada}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span className="text-xs text-slate-500 font-medium">Menos Estudada</span>
              <span className="text-sm font-bold text-slate-900">{isLoading ? '...' : stats.destaques.menosEstudada}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <Library className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-slate-500 font-medium">Mais Tópicos</span>
              <span className="text-sm font-bold text-slate-900">{isLoading ? '...' : stats.destaques.maisTopicos}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <Book className="w-5 h-5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Menos Tópicos</span>
              <span className="text-sm font-bold text-slate-900">{isLoading ? '...' : stats.destaques.menosTopicos}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span className="text-xs text-slate-500 font-medium">Melhor Precisão</span>
              <span className="text-sm font-bold text-slate-900">{isLoading ? '...' : stats.destaques.melhorPrecisao}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-xs text-slate-500 font-medium">Pior Precisão</span>
              <span className="text-sm font-bold text-slate-900">{isLoading ? '...' : stats.destaques.piorPrecisao}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <FileQuestion className="w-5 h-5 text-indigo-500" />
              <span className="text-xs text-slate-500 font-medium">Mais Questões</span>
              <span className="text-sm font-bold text-slate-900">{isLoading ? '...' : stats.destaques.maisQuestoes}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <FileQuestion className="w-5 h-5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Menos Questões</span>
              <span className="text-sm font-bold text-slate-900">{isLoading ? '...' : stats.destaques.menosQuestoes}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-xs text-slate-500 font-medium">Melhor em Provas</span>
              <span className="text-sm font-bold text-slate-900">-</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-slate-500 font-medium">Pior em Provas</span>
              <span className="text-sm font-bold text-slate-900">-</span>
            </div>
          </div>
        </div>

        {/* 3. EVOLUÇÃO (GRÁFICOS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Evolução Anual (Horas)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.annualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="horas" fill="#71c385" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Atividade Mensal (30 dias)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={<CustomXAxisTick />} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Line type="monotone" dataKey="atividade" stroke="#5F8C65" strokeWidth={3} dot={{ r: 4, fill: '#5F8C65', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 4. DISTRIBUIÇÃO E 5. MOTIVOS DE ERRO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center">
              <h2 className="text-lg font-bold text-slate-900 mb-2 self-start">Tópicos Finalizados</h2>
              <div className="relative h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.finishedTopicsData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.finishedTopicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-900">{isLoading ? '...' : stats.totalTopicosFeitos}</span>
                  <span className="text-xs font-medium text-slate-500 uppercase">Total</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {stats.finishedTopicsData.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                    {item.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center">
              <h2 className="text-lg font-bold text-slate-900 mb-2 self-start">Erros por Matéria</h2>
              <div className="relative h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.wrongQuestionsData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.wrongQuestionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-900">{isLoading ? '...' : stats.totalErros}</span>
                  <span className="text-xs font-medium text-slate-500 uppercase">Total</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {stats.wrongQuestionsData.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Motivos de Erro</h2>
            <div className="space-y-6">
              {errorReasons.map((reason) => {
                const colors = getErrorColorClass(reason.percent)
                const Icon = reason.icon
                
                return (
                  <div key={reason.id} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                        <span className="text-sm font-bold text-slate-700">{reason.name}</span>
                      </div>
                      <span className={`text-sm font-bold ${colors.text}`}>{reason.percent}%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${colors.track}`}>
                      <div 
                        className={`h-2 rounded-full ${colors.bg} transition-all duration-500`} 
                        style={{ width: `${reason.percent}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}