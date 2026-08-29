'use client'

import { 
  Clock, CheckCircle2, Target, BookOpen, 
  TrendingUp, TrendingDown, Library, Award, 
  AlertTriangle, XCircle, Brain, AlertCircle
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

// ==========================================
// DADOS MOCKADOS
// ==========================================

const annualData = [
  { name: 'Jan', horas: 12 }, { name: 'Fev', horas: 15 }, { name: 'Mar', horas: 22 },
  { name: 'Abr', horas: 18 }, { name: 'Mai', horas: 25 }, { name: 'Jun', horas: 30 },
  { name: 'Jul', horas: 28 }, { name: 'Ago', horas: 35 }, { name: 'Set', horas: 40 },
  { name: 'Out', horas: 45 }, { name: 'Nov', horas: 55 }, { name: 'Dez', horas: 50 },
]

const monthlyData = [
  { name: 'Semana 1', atividade: 8 },
  { name: 'Semana 2', atividade: 12 },
  { name: 'Semana 3', atividade: 15 },
  { name: 'Semana 4', atividade: 18 },
]

const finishedTopicsData = [
  { name: 'Matemática', value: 25, fill: '#243E36' }, // primary-900
  { name: 'Português', value: 20, fill: '#436E4B' }, // primary-700
  { name: 'Biologia', value: 18, fill: '#5F8C65' }, // primary-600
  { name: 'História', value: 12, fill: '#9DBF97' }, // primary-400
]

const wrongQuestionsData = [
  { name: 'Física', value: 35, fill: '#152620' }, // primary-950
  { name: 'Química', value: 25, fill: '#33553E' }, // primary-800
  { name: 'Matemática', value: 20, fill: '#5F8C65' }, // primary-600
  { name: 'Geografia', value: 12, fill: '#7CA982' }, // primary-500
  { name: 'História', value: 8, fill: '#BED6AC' }, // primary-300
]

const errorReasons = [
  { id: 1, name: 'Falta de Atenção', percent: 45, icon: AlertCircle },
  { id: 2, name: 'Erro de Cálculo', percent: 30, icon: AlertTriangle },
  { id: 3, name: 'Erro de Conceito', percent: 25, icon: Brain },
]

export default function EstatisticasPage() {
  
  // Função para determinar a cor do motivo do erro baseado na porcentagem
  const getErrorColorClass = (percent: number) => {
    if (percent >= 40) return { bg: 'bg-red-600', text: 'text-red-700', track: 'bg-red-100' }
    if (percent >= 26 && percent <= 39) return { bg: 'bg-red-400', text: 'text-red-600', track: 'bg-red-50' }
    return { bg: 'bg-red-200', text: 'text-red-500', track: 'bg-slate-100' }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABEÇALHO */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Estatísticas</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Acompanhe seu desempenho geral</p>
        </div>

        {/* 1. KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-primary-100 p-3 rounded-xl text-primary-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Tempo Total</p>
              <p className="text-2xl font-bold text-slate-900">150.1h</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Questões Feitas</p>
              <p className="text-2xl font-bold text-slate-900">1.061</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Precisão Global</p>
              <p className="text-2xl font-bold text-slate-900">78%</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Tópicos Feitos</p>
              <p className="text-2xl font-bold text-slate-900">65</p>
            </div>
          </div>
        </div>

        {/* 2. DESTAQUES */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Destaques</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-xs text-slate-500 font-medium">Mais Estudada</span>
              <span className="text-sm font-bold text-slate-900">Matemática</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span className="text-xs text-slate-500 font-medium">Menos Estudada</span>
              <span className="text-sm font-bold text-slate-900">Geografia</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <Library className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-slate-500 font-medium">Mais Tópicos</span>
              <span className="text-sm font-bold text-slate-900">Português</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span className="text-xs text-slate-500 font-medium">Melhor Precisão</span>
              <span className="text-sm font-bold text-slate-900">Biologia - 85%</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-slate-500 font-medium">Pior em Provas</span>
              <span className="text-sm font-bold text-slate-900">Física</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-xs text-slate-500 font-medium">Mais Erros</span>
              <span className="text-sm font-bold text-slate-900">Química</span>
            </div>
          </div>
        </div>

        {/* 3. EVOLUÇÃO (GRÁFICOS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Evolução Anual (Horas)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={annualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
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
          
          {/* Gráficos de Rosca */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center">
              <h2 className="text-lg font-bold text-slate-900 mb-2 self-start">Tópicos Finalizados</h2>
              <div className="relative h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={finishedTopicsData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {finishedTopicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-900">75</span>
                  <span className="text-xs font-medium text-slate-500 uppercase">Total</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {finishedTopicsData.map((item, i) => (
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
                      data={wrongQuestionsData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {wrongQuestionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-900">100</span>
                  <span className="text-xs font-medium text-slate-500 uppercase">Total</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {wrongQuestionsData.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Motivos de Erro */}
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