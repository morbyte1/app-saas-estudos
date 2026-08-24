'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { saveStudySession } from '@/app/dashboard/actions'
import { ChevronDown, Settings, Maximize, Plus, ChevronRight, Circle } from 'lucide-react'

export default function TimerPage() {
  // ==========================================
  // ESTADOS ORIGINAIS PRESERVADOS
  // ==========================================
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Novo estado para controlar a aba de histórico
  const [showHistory, setShowHistory] = useState(false)

  // ==========================================
  // LÓGICA ORIGINAL PRESERVADA
  // ==========================================
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1)
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleFinish = async () => {
    setIsLoading(true)
    setIsRunning(false)

    const result = await saveStudySession(seconds)

    if (result.success) {
      setSeconds(0)
    } else {
      console.error('Error saving session:', result.error)
    }

    setIsLoading(false)
  }

  // ==========================================
  // NOVA INTERFACE (UI)
  // ==========================================
  return (
    <div className="h-screen flex bg-white text-slate-900 overflow-hidden">
      
      {/* SEÇÃO ESQUERDA (PRINCIPAL) */}
      <div className="flex-1 p-8 flex flex-col justify-between h-full relative">
        
        {/* Header (Topo) */}
        <div className="flex justify-between items-start w-full">
          {/* Esquerda: Botões de Matéria e Assunto */}
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold uppercase hover:bg-[#8961DA] hover:text-white transition-colors hover:border-[#8961DA] group">
              <span>MATÉRIA: GERAL</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold uppercase hover:bg-[#8961DA] hover:text-white transition-colors hover:border-[#8961DA] group">
              <span>ASSUNTO: GERAL</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Direita: Ações Rápidas */}
          <div className="flex gap-3 items-center">
            {/* Preservando o Link original para voltar ao dashboard */}
            <Link
              href="/dashboard"
              className="text-xs font-bold uppercase text-slate-400 hover:text-[#8961DA] transition-colors mr-2"
            >
              Dashboard
            </Link>
            
            <button className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-[#8961DA] hover:text-white transition-colors hover:border-[#8961DA]">
              <Settings className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-[#8961DA] hover:text-white transition-colors hover:border-[#8961DA]">
              <Maximize className="w-4 h-4" />
            </button>
            <button className="px-6 py-2.5 rounded-full border border-slate-200 text-xs font-bold uppercase hover:bg-[#8961DA] hover:text-white transition-colors hover:border-[#8961DA]">
              DESCANSAR AGORA
            </button>
          </div>
        </div>

        {/* Centro (Timer) */}
        <div className="flex flex-col items-center justify-center flex-1">
          {/* Relógio Gigante */}
          <div className="text-9xl font-bold tracking-tight text-slate-900 mb-8">
            {formatTime(seconds)}
          </div>
          
          {/* Botão Novo Solicitado */}
          <button className="px-8 py-3.5 bg-slate-900 text-white rounded-full text-sm font-bold uppercase hover:bg-[#8961DA] transition-colors shadow-sm">
            ENVIAR MANUAL
          </button>

          {/* Controles Originais do Timer Preservados e Estilizados */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleStart}
              disabled={isRunning || isLoading}
              className="px-6 py-2 bg-slate-100 text-slate-900 font-bold rounded-full hover:bg-slate-200 focus:outline-none transition disabled:opacity-50 text-xs uppercase"
            >
              Iniciar
            </button>

            <button
              onClick={handlePause}
              disabled={!isRunning || isLoading}
              className="px-6 py-2 bg-slate-100 text-slate-900 font-bold rounded-full hover:bg-slate-200 focus:outline-none transition disabled:opacity-50 text-xs uppercase"
            >
              Pausar
            </button>

            <button
              onClick={handleFinish}
              disabled={isLoading}
              className="px-6 py-2 bg-slate-900 text-white font-bold rounded-full hover:bg-[#8961DA] focus:outline-none transition disabled:opacity-50 text-xs uppercase flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                'Finalizar'
              )}
            </button>
          </div>
        </div>

        {/* Rodapé (Histórico) */}
        <div className="w-full">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">HISTÓRICO</h3>
            <Plus className={`w-4 h-4 text-slate-900 transition-transform duration-300 ${showHistory ? 'rotate-45' : ''}`} />
          </button>
          
          {showHistory && (
            <div className="w-full animate-in slide-in-from-bottom-2 fade-in duration-200">
              <button className="w-full flex items-center justify-between px-6 py-4 rounded-full border border-slate-200 hover:border-[#8961DA] transition-colors group bg-white shadow-sm hover:shadow">
                <span className="text-sm font-bold text-slate-700 uppercase">SEGUNDA - FEIRA, 26 DE AGOSTO</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#8961DA] transition-colors" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* SEÇÃO DIREITA (SIDEBAR DE TAREFAS) */}
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

    </div>
  )
}