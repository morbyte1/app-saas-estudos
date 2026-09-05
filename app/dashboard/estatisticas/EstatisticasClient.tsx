'use client'

import { 
  Clock, CheckCircle2, Target, BookOpen, 
  TrendingUp, TrendingDown, Library, Award, 
  AlertTriangle, Brain, AlertCircle,
  Book, FileQuestion, BarChart2
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import Link from 'next/link'

const errorReasons = [
  { id: 1, name: 'Falta de Atenção', percent: 45, icon: AlertCircle },
  { id: 2, name: 'Erro de Cálculo', percent: 30, icon: AlertTriangle },
  { id: 3, name: 'Erro de Conceito', percent: 25, icon: Brain },
]

interface EstatisticasProps {
  initialStats: {
    totalDurationFormatted: string;
    totalQuestions: number;
    globalPrecision: number;
    totalTopicosFeitos: number;
    totalErros: number;
    destaques: {
      maisEstudada: string;
      menosEstudada: string;
      maisTopicos: string;
      menosTopicos: string;
      melhorPrecisao: string;
      piorPrecisao: string;
      maisQuestoes: string;
      menosQuestoes: string;
    };
    annualData: any[];
    monthlyData: any[];
    finishedTopicsData: any[];
    wrongQuestionsData: any[];
  }
}

export default function EstatisticasClient({ initialStats }: EstatisticasProps) {
  // Os dados já chegam carregados do servidor
  const stats = initialStats;

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
          <p className="text-sm text-slate-500 mt-2 font-medium">Veja como você tá evoluindo</p>
        </div>

        {/* 1. KPIs REAIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-primary-100 p-3 rounded-xl text-primary-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Meu tempo total</p>
              <div className="text-2xl font-bold text-slate-900 min-h-[32px] flex items-center">
                {stats.totalDurationFormatted}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Minhas questões feitas</p>
              <div className="text-2xl font-bold text-slate-900 min-h-[32px] flex items-center">
                {stats.totalQuestions}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Minha precisão</p>
              <div className="text-2xl font-bold text-slate-900 min-h-[32px] flex items-center">
                {`${stats.globalPrecision}%`}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Meus tópicos concluídos</p>
              <div className="text-2xl font-bold text-slate-900 min-h-[32px] flex items-center">
                {stats.totalTopicosFeitos}
              </div>
            </div>
          </div>
        </div>

        {/* 2. DESTAQUES REAIS */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Meus destaques</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-xs text-slate-500 font-medium">Matéria mais estudada</span>
              <div className="text-sm font-bold text-slate-900 min-h-[20px] flex items-center">
                {stats.destaques.maisEstudada}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span className="text-xs text-slate-500 font-medium">Matéria menos estudada</span>
              <div className="text-sm font-bold text-slate-900 min-h-[20px] flex items-center">
                {stats.destaques.menosEstudada}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <Library className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-slate-500 font-medium">Matéria com mais tópicos</span>
              <div className="text-sm font-bold text-slate-900 min-h-[20px] flex items-center">
                {stats.destaques.maisTopicos}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <Book className="w-5 h-5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Matéria com menos tópicos</span>
              <div className="text-sm font-bold text-slate-900 min-h-[20px] flex items-center">
                {stats.destaques.menosTopicos}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span className="text-xs text-slate-500 font-medium">Melhor Precisão</span>
              <div className="text-sm font-bold text-slate-900 min-h-[20px] flex items-center">
                {stats.destaques.melhorPrecisao}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-xs text-slate-500 font-medium">Precisão mais baixa</span>
              <div className="text-sm font-bold text-slate-900 min-h-[20px] flex items-center">
                {stats.destaques.piorPrecisao}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <FileQuestion className="w-5 h-5 text-indigo-500" />
              <span className="text-xs text-slate-500 font-medium">Matéria com mais questões feitas</span>
              <div className="text-sm font-bold text-slate-900 min-h-[20px] flex items-center">
                {stats.destaques.maisQuestoes}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <FileQuestion className="w-5 h-5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Matéria com menos questões feitas</span>
              <div className="text-sm font-bold text-slate-900 min-h-[20px] flex items-center">
                {stats.destaques.menosQuestoes}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-xs text-slate-500 font-medium">Melhor resultado em provas</span>
              <div className="text-sm font-bold text-slate-900 min-h-[20px] flex items-center">
                {'-'}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-slate-500 font-medium">Resultado a melhorar em provas</span>
              <div className="text-sm font-bold text-slate-900 min-h-[20px] flex items-center">
                {'-'}
              </div>
            </div>
          </div>
        </div>

        {/* 3, 4 E 5. GRÁFICOS OU EMPTY STATE */}
        {stats.totalDurationFormatted === '0min' && stats.totalQuestions === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center mt-8 shadow-sm">
            <BarChart2 className="w-16 h-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Seu mapa de evolução aparecerá aqui</h2>
            <p className="text-slate-500 mb-6 max-w-md">
              Comece a registrar seus estudos no Timer para ver seu desempenho.
            </p>
            <Link 
              href="/dashboard/timer" 
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition shadow-sm"
            >
              Ir para o Timer
            </Link>
          </div>
        ) : (
          <>
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
                  <h2 className="text-lg font-bold text-slate-900 mb-2 self-start">Meus tópicos finalizados</h2>
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
                      <div className="text-3xl font-bold text-slate-900 h-9 flex items-center justify-center">
                        {stats.totalTopicosFeitos}
                      </div>
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
                  <h2 className="text-lg font-bold text-slate-900 mb-2 self-start">Meus erros por matéria</h2>
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
                      <div className="text-3xl font-bold text-slate-900 h-9 flex items-center justify-center">
                        {stats.totalErros}
                      </div>
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
                <h2 className="text-lg font-bold text-slate-900 mb-6">Por que eu erro</h2>
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
          </>
        )}
      </div>
    </div>
  )
}