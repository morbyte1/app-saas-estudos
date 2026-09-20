'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { createPendingAction } from '@/lib/pendingAction'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
  isLoading?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = true,
  isLoading = false
}: ConfirmModalProps) {
  const [pending, setPending] = useState(false)
  const run = useRef(createPendingAction())
  const busy = isLoading || pending
  const handleConfirm = () => run.current(async () => {
    setPending(true)
    try { await onConfirm() }
    finally { setPending(false) }
  })
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-overlay">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-modal">
        <div className="flex justify-between items-center mb-5">
          <h3 className={`text-xl font-bold flex items-center gap-2 ${isDanger ? 'text-red-600' : 'text-slate-900'}`}>
            {isDanger && <AlertTriangle className="w-5 h-5" />}
            {title}
          </h3>
          <button 
            onClick={onCancel} 
            disabled={busy}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            aria-busy={busy}
            className={`flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition disabled:opacity-50 ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {busy ? 'Aguarde...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
