'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { AlertCircle, CheckCircle, X } from 'lucide-react'

type ToastType = 'error' | 'success'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextData {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    
    // Remove automaticamente após 5 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`pointer-events-auto flex items-start gap-3 p-4 w-80 bg-white border-l-4 rounded-2xl shadow-xl transition-all duration-300 animate-in slide-in-from-right-8 fade-in border-y border-r border-slate-100 ${
              t.type === 'error' ? 'border-l-red-500' : 'border-l-emerald-500'
            }`}
          >
            {t.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">
                {t.type === 'error' ? 'Aviso' : 'Sucesso'}
              </p>
              <p className="text-sm text-slate-500 mt-0.5 leading-snug">
                {t.message}
              </p>
            </div>
            <button 
              onClick={() => removeToast(t.id)} 
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)