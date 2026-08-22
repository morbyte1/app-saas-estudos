'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { saveStudySession } from '@/app/dashboard/actions'

export default function TimerPage() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center mb-4">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white transition flex items-center gap-2"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Timer</h1>
          <p className="text-zinc-400">Gerencie seu tempo de foco</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div className="text-center mb-8">
            <div className="text-8xl font-bold text-white tracking-wider">
              {formatTime(seconds)}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStart}
              disabled={isRunning || isLoading}
              className="flex-1 px-6 py-4 bg-white text-zinc-950 font-semibold rounded-lg hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-offset-2 focus:ring-offset-zinc-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Iniciar
            </button>

            <button
              onClick={handlePause}
              disabled={!isRunning || isLoading}
              className="flex-1 px-6 py-4 bg-zinc-800 text-white font-semibold rounded-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-offset-2 focus:ring-offset-zinc-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pausar
            </button>

            <button
              onClick={handleFinish}
              disabled={isLoading}
              className="flex-1 px-6 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      </div>
    </div>
  )
}
