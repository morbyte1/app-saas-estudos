'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastContext'
import { MOTIVOS_ERRO, CONFIANCAS, assuntoDoErro, type CadernoErro, type ErroInput, type MotivoErro, type Confianca } from '@/lib/caderno'
import { saveCadernoErro } from './actions'

interface Props {
  materias: { id: string; name: string }[]
  assuntos: { id: string; name: string; materia_id: string }[]
  erro?: CadernoErro | null
  onClose: () => void
}

export default function CadernoForm({ materias, assuntos, erro, onClose }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(!!erro)
  const [materiaId, setMateriaId] = useState(erro?.materia_id || '')
  const [assuntoId, setAssuntoId] = useState(erro?.assunto_id || '')
  const [assuntoTexto, setAssuntoTexto] = useState(erro ? assuntoDoErro(erro) : '')
  const [motivo, setMotivo] = useState<MotivoErro | ''>((MOTIVOS_ERRO as readonly string[]).includes(erro?.motivo_erro || '') ? erro?.motivo_erro as MotivoErro : '')
  const [enunciado, setEnunciado] = useState(erro?.enunciado || '')
  const [resposta, setResposta] = useState(erro?.resposta_correta || '')
  const [confianca, setConfianca] = useState<Confianca | ''>((CONFIANCAS as readonly string[]).includes(erro?.confianca || '') ? erro?.confianca as Confianca : '')

  const save = async () => {
    if (!materiaId || !assuntoTexto.trim() || !motivo) return toast('Informe matéria, assunto e motivo.', 'error')
    const input: ErroInput = {
      materia_id: materiaId, assunto_id: assuntoId || null, assunto_texto: assuntoTexto,
      motivo_erro: motivo, enunciado: enunciado || null, resposta_correta: resposta || null,
      confianca: confianca || null,
    }
    setSaving(true)
    try {
      const result = await saveCadernoErro(input, erro?.id)
      if (result.error) return toast(result.error, 'error')
      toast(erro ? 'Erro atualizado.' : 'Erro registrado.', 'success')
      onClose()
      router.refresh()
    } catch {
      toast('Não foi possível salvar o erro. Tente novamente.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label={erro ? 'Editar erro' : 'Registrar erro'} onClick={e => e.stopPropagation()} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{erro ? 'Editar erro' : 'Registrar erro'}</h2>
        <button onClick={onClose} aria-label="Fechar" className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100">✕</button>
      </div>
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">Matéria *
          <select value={materiaId} onChange={e => { setMateriaId(e.target.value); setAssuntoId(''); setAssuntoTexto('') }} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3">
            <option value="">Selecione a matéria</option>{materias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">Assunto *
          <input value={assuntoTexto} onChange={e => { setAssuntoTexto(e.target.value); setAssuntoId('') }} placeholder="Ex.: Funções" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
        </label>
        {materiaId && assuntos.some(a => a.materia_id === materiaId) && <select aria-label="Usar assunto cadastrado" value={assuntoId} onChange={e => { const a = assuntos.find(x => x.id === e.target.value); setAssuntoId(a?.id || ''); if (a) setAssuntoTexto(a.name) }} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
          <option value="">Ou escolha um assunto cadastrado</option>{assuntos.filter(a => a.materia_id === materiaId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>}
        <label className="block text-sm font-semibold text-slate-700">Motivo do erro *
          <select value={motivo} onChange={e => setMotivo(e.target.value as MotivoErro)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3">
            <option value="">Selecione o motivo</option>{MOTIVOS_ERRO.map(m => <option key={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <button type="button" onClick={() => setDetailsOpen(!detailsOpen)} className="mt-5 text-sm font-semibold text-primary-700">{detailsOpen ? 'Ocultar detalhes opcionais' : 'Adicionar detalhes opcionais'}</button>
      {detailsOpen && <div className="mt-4 space-y-4">
        <label className="block text-sm font-semibold text-slate-700">Questão ou referência
          <textarea value={enunciado} onChange={e => setEnunciado(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">O que eu deveria ter percebido
          <textarea value={resposta} onChange={e => setResposta(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Confiança ao responder
          <select value={confianca} onChange={e => setConfianca(e.target.value as Confianca | '')} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3">
            <option value="">Não informada</option>{CONFIANCAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-xl px-4 py-2 font-semibold text-slate-600">Cancelar</button>
        <button onClick={save} disabled={saving} className="rounded-xl bg-primary-600 px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar erro'}</button>
      </div>
    </section>
  </div>
}
