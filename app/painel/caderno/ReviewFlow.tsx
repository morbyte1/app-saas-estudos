'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastContext'
import { MOTIVOS_ERRO, CONFIANCAS, assuntoDoErro, dadosRevisaoCompletos, type CadernoErro } from '@/lib/caderno'
import { reviewCadernoErro } from './actions'
import { createPendingAction } from '@/lib/pendingAction'

export default function ReviewFlow({ erro, onClose }: { erro: CadernoErro; onClose: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const [revealed, setRevealed] = useState(false)
  const [rascunho, setRascunho] = useState('')
  const [saving, setSaving] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [confianca, setConfianca] = useState('')
  const [feedback, setFeedback] = useState('')
  const runFinish = useRef(createPendingAction())

  const finish = (acertou: boolean) => runFinish.current(async () => {
    setSaving(true)
    try {
      const result = await reviewCadernoErro(erro.id, acertou, motivo || null, confianca || null)
      if (result.error) return toast(result.error, 'error')
      const nextLevel = acertou ? (erro.nivel_revisao || 0) + 1 : 0
      setFeedback(!acertou ? 'Tentativa registrada. A questão volta amanhã.' : nextLevel >= 4
        ? 'Domínio registrado. O erro permanece no seu histórico.'
        : `Acerto registrado. Próxima revisão em ${nextLevel === 1 ? 3 : nextLevel === 2 ? 7 : 21} dias.`)
      router.refresh()
    } catch {
      toast('Não foi possível registrar a revisão. Tente novamente.', 'error')
    } finally {
      setSaving(false)
    }
  })

  return <div className="animate-overlay fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label="Revisar erro" onClick={e => e.stopPropagation()} className="animate-enter max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase text-primary-700">Revisão</p><h2 className="mt-1 text-xl font-bold text-slate-900">{erro.materias?.name || 'Matéria'} · {assuntoDoErro(erro)}</h2></div>
        <button aria-label="Fechar" onClick={onClose} className="text-slate-500">✕</button>
      </div>
      {!dadosRevisaoCompletos(erro) ? <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Complete assunto, questão e resolução em Editar antes de revisar.</p> : feedback ? <div className="mt-6 rounded-2xl bg-primary-50 p-5 text-primary-900"><p>{feedback}</p><button onClick={onClose} className="mt-4 font-bold text-primary-700">Concluir</button></div> : <>
        <p className="mt-5 text-sm text-slate-600">Tente resolver ou lembrar o raciocínio antes de revelar o aprendizado.</p>
        <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-800">{erro.enunciado}</div>
        <label className="mt-4 block text-sm font-semibold text-slate-700">Seu rascunho (opcional)
          <textarea value={rascunho} onChange={e => setRascunho(e.target.value)} rows={3} placeholder="Anote como resolveria antes de revelar" className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" />
        </label>
        {!revealed ? <button onClick={() => setRevealed(true)} className="mt-5 rounded-xl bg-primary-600 px-5 py-3 font-bold text-white">Revelar aprendizado</button> : <>
          <div className="mt-5 rounded-2xl bg-primary-50 p-4 text-slate-800"><p className="text-xs font-bold uppercase text-primary-700">Resolução / aprendizado</p><p className="mt-2 whitespace-pre-wrap">{erro.resposta_correta}</p></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Motivo percebido (opcional)<select value={motivo} onChange={e => setMotivo(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2"><option value="">Manter motivo atual</option>{MOTIVOS_ERRO.map(m => <option key={m}>{m}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Confiança (opcional)<select value={confianca} onChange={e => setConfianca(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2"><option value="">Não informar</option>{CONFIANCAS.map(c => <option key={c}>{c}</option>)}</select></label>
          </div>
          <p className="mt-5 text-sm font-semibold text-slate-700">Conseguiu acertar o raciocínio?</p>
          <div className="mt-3 flex flex-wrap gap-3"><button disabled={saving} onClick={() => finish(false)} className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">{saving ? 'Aguarde...' : 'Ainda errei'}</button><button disabled={saving} onClick={() => finish(true)} className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Aguarde...' : 'Consegui acertar'}</button></div>
        </>}
      </>}
    </section>
  </div>
}
