'use client'

import Link from 'next/link'
import { Calendar, Clock, Target, TrendingUp, Plus, Medal, Flame, CheckCircle, PlayCircle } from 'lucide-react'

export default function DashboardPage() {

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Seja bem-vindo, Lucas!</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">"O sucesso é a soma de pequenos esforços repetidos dia após dia." — Robert Collier</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-purple-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition">
            <Calendar className="w-4 h-4" />
            Hoje, 24 de Outubro
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Tempo Hoje</span>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">2h 35min</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Horas Totais</span>
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">48h</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Sequência</span>
              <div className="bg-amber-100 p-1.5 rounded-lg">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">12 dias</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Meta Diária</span>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Target className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-2">85%</p>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Meta Prova</span>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">Faltam 5 dias</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Matérias em Destaque</h2>
                <Link href="#" className="text-purple-600 text-sm font-medium hover:text-purple-700">
                  Ver todas
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">Matemática</span>
                    <span className="text-slate-500 text-xs font-medium">2h 15min</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 text-sm">Meta semanal</span>
                    <span className="text-slate-900 text-sm font-bold">80%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full mt-2">
                    <div className="h-full bg-purple-600 rounded-full w-[80%]"></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">Física</span>
                    <span className="text-slate-500 text-xs font-medium">1h 45min</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 text-sm">Meta semanal</span>
                    <span className="text-slate-900 text-sm font-bold">65%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full mt-2">
                    <div className="h-full bg-green-600 rounded-full w-[65%]"></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">Química</span>
                    <span className="text-slate-500 text-xs font-medium">1h 20min</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 text-sm">Meta semanal</span>
                    <span className="text-slate-900 text-sm font-bold">50%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full mt-2">
                    <div className="h-full bg-purple-600 rounded-full w-[50%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 mt-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Cronograma de Hoje</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 flex flex-col">
                    <span className="text-slate-900 font-bold">09:00</span>
                    <span className="text-slate-400 text-xs">45min</span>
                  </div>
                  <div className="w-1 h-10 rounded-full bg-emerald-500 mx-4"></div>
                  <div className="flex-1 text-sm font-semibold text-slate-700">Revisão de Fórmulas Matemáticas</div>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 flex flex-col">
                    <span className="text-slate-900 font-bold">10:00</span>
                    <span className="text-slate-400 text-xs">1h</span>
                  </div>
                  <div className="w-1 h-10 rounded-full bg-emerald-500 mx-4"></div>
                  <div className="flex-1 text-sm font-semibold text-slate-700">Exercícios de Física</div>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 flex flex-col">
                    <span className="text-slate-900 font-bold">14:00</span>
                    <span className="text-slate-400 text-xs">1h</span>
                  </div>
                  <div className="w-1 h-10 rounded-full bg-purple-500 mx-4"></div>
                  <div className="flex-1 text-sm font-semibold text-slate-700">Estudo de Química</div>
                  <PlayCircle className="w-5 h-5 text-purple-500" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 flex flex-col">
                    <span className="text-slate-900 font-bold">16:00</span>
                    <span className="text-slate-400 text-xs">45min</span>
                  </div>
                  <div className="w-1 h-10 rounded-full bg-purple-500 mx-4"></div>
                  <div className="flex-1 text-sm font-semibold text-slate-700">Revisão Geral</div>
                  <PlayCircle className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">Lista de Tarefas</h2>
                <button className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4 border border-slate-100 rounded-xl p-4">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 rounded border-slate-300" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-400 line-through">Resolver exercícios cap. 3</p>
                    <p className="text-purple-600 text-xs font-semibold">Matemática</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 border border-slate-100 rounded-xl p-4">
                  <input type="checkbox" className="w-4 h-4 text-purple-600 rounded border-slate-300" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Ler resumo de Mecânica</p>
                    <p className="text-purple-600 text-xs font-semibold">Física</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 border border-slate-100 rounded-xl p-4">
                  <input type="checkbox" className="w-4 h-4 text-purple-600 rounded border-slate-300" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Fazer lista de exercícios</p>
                    <p className="text-green-600 text-xs font-semibold">Química</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 border border-slate-100 rounded-xl p-4">
                  <input type="checkbox" className="w-4 h-4 text-purple-600 rounded border-slate-300" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Revisar anotações</p>
                    <p className="text-blue-600 text-xs font-semibold">Geral</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Medal className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Próxima Conquista</h3>
                  <p className="text-slate-500 text-sm">Falta muito pouco!</p>
                </div>
              </div>
              <p className="font-bold text-slate-900 mb-2">Maratonista de Estudos</p>
              <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
              <p className="text-purple-600 text-sm font-medium">9/10 horas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
