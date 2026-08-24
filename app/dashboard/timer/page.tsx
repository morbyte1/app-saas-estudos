'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { saveStudySession } from '@/app/dashboard/actions'
import { getMaterias } from '@/app/dashboard/materias/actions'
import { getTopicosEAssuntos } from '@/app/dashboard/materias/[materia]/actions'
import { ChevronDown, Settings, Maximize, Plus, ChevronRight, Circle, HelpCircle } from 'lucide-react'

interface Materia {
  id: string
  name: string
  goalHours: number
  studiedHours: number
  studiedMinutes: number
  progress: number
}

interface Topico {
  id: string
  name: string
}

interface Assunto {
  id: string
  topico_id: string
  name: string
  duration_minutes: number
  is_done: boolean
}

export default function TimerPage() {
  // ==========================================
  // ESTADOS ORIGINAIS E NOVOS PRESERVADOS
  // ==========================================
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Novo estado para controlar a aba de histórico
  const [showHistory, setShowHistory] = useState(false)

  // Estados para Matérias, Tópicos e Assuntos
  const [materias, setMaterias] = useState<Materia[]>([])
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>('')
  
  const [topicos, setTopicos] = useState<Topico[]>([])
  const [assuntos, setAssuntos] = useState<Assunto[]>([])
  const [selectedAssuntoId, setSelectedAssuntoId] = useState<string>('')

  // ==========================================
  // BUSCA DE DADOS (MATÉRIAS E ASSUNTOS)
  // ==========================================
  useEffect(() => {
    const fetchInitialData = async () => {
      const result = await getMaterias()
      if (result.success && result.data && result.data.length > 0) {
        setMaterias(result.data)
        setSelectedMateriaId(result.data[0].id)
      }
    }
    fetchInitialData()
  }, [])

  useEffect(() => {
    const fetchAssuntosForMateria = async () => {
      if (!selectedMateriaId) {
        setTopicos([])
        setAssuntos([])
        setSelectedAssuntoId('')
        return
      }

      const materiaObj = materias.find(m => m.id === selectedMateriaId)
      if (!materiaObj) return

      const result = await getTopicosEAssuntos(materiaObj.id)
      if (!result.error) {
        setTopicos(result.topicos || [])
        setAssuntos(result.assuntos || [])
        if (result.assuntos && result.assuntos.length > 0) {
          setSelectedAssuntoId(result.assuntos[0].id)
        } else {
          setSelectedAssuntoId('')
        }
      }
    }
    fetchAssuntosForMateria()
  }, [selectedMateriaId, materias])

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

  // Mapeia os assuntos agrupados por tópicos para o dropdown
  const assuntosDoTopicoAtual = assuntos.filter(a => {
    return topicos.some(t => t.id === a.topico_id)
  })

  // ==========================================
  // NOVA INTERFACE (UI)
  // ==========================================
  return (
    <div className="h-screen flex bg-white text-slate-900 overflow-hidden">
      
      {/* SEÇÃO ESQUERDA (PRINCIPAL) */}
      <div className="flex-1 p-8 flex flex-col justify-between h-full relative">
        
        {/* Header (Topo) */}
        <div className="flex justify-between items-start w-full">
          {/* Esquerda: Dropdowns Empilhados de Matéria e Assunto */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <select
                value={selectedMateriaId}
                onChange={(e) => setSelectedMateriaId(e.target.value)}
                className="appearance-none flex items-center justify-between gap-4 px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold uppercase bg-white text-slate-700 hover:bg-[#8961DA] hover:text-white transition-colors hover:border-[#8961DA] cursor-pointer pr-10 focus:outline-none"
              >
                <option value="" disabled>SELECIONE A MATÉRIA</option>
                {materias.map(m => (
                  <option key={m.id} value={m.id} className="text-slate-900 bg-white">
                    MATÉRIA: {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedAssuntoId}
                onChange={(e) => setSelectedAssuntoId(e.target.value)}
                className="appearance-none flex items-center justify-between gap-4 px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold uppercase bg-white text-slate-700 hover:bg-[#8961DA] hover:text-white transition-colors hover:border-[#8961DA] cursor-pointer pr-10 focus:outline-none"
              >
                <option value="" disabled>SELECIONE O ASSUNTO</option>
                {assuntos.map(a => (
                  <option key={a.id} value={a.id} className="text-slate-900 bg-white">
                    ASSUNTO: {a.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Direita: Ações Rápidas (Sem o botão dashboard, com Descansar Agora integrado) */}
          <div className="flex gap-3 items-center">
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

        {/* Centro (Timer e Controles Destacados) */}
        <div className="flex flex-col items-center justify-center flex-1">
          {/* Relógio Gigante */}
          <div className="text-9xl font-bold tracking-tight text-slate-900 mb-6">
            {formatTime(seconds)}
          </div>

          {/* Botões Principais em Alto Destaque (Iniciar, Pausar, Finalizar) */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleStart}
              disabled={isRunning || isLoading}
              className="px-8 py-3.5 bg-[#8961DA] text-white font-bold rounded-full hover:bg-[#784fcb] focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-md"
            >
              Iniciar
            </button>

            <button
              onClick={handlePause}
              disabled={!isRunning || isLoading}
              className="px-8 py-3.5 bg-slate-200 text-slate-800 font-bold rounded-full hover:bg-slate-300 focus:outline-none transition disabled:opacity-50 text-sm uppercase shadow-sm"
            >
              Pausar
            </button>

            <button
              onClick={handleFinish}
              disabled={isLoading}
              className="px-8 py-3.5 bg-slate-900 text-white font-bold rounded-full hover:bg-[#8961DA] focus:outline-none transition disabled:opacity-50 text-sm uppercase flex items-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          
          {/* Botão Enviar Manual Rebaixado com Pergunta e Ícone de Interrogação */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
              <HelpCircle className="w-4 h-4 text-[#8961DA]" />
              <span>Esqueceu de ligar o timer ou estudou fora do app? Envie seu tempo estudado abaixo</span>
            </div>
            <button className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase hover:bg-slate-200 transition-colors border border-slate-200">
              ENVIAR MANUAL
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