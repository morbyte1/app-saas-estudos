'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useToast } from '@/components/ToastContext'
import { MOTIVOS_ERRO, CONFIANCAS, type CadernoErro, type ErroInput, type MotivoErro, type Confianca } from '@/lib/caderno'
import { saveCadernoErro } from './actions'

interface Props {
  materias: { id: string; name: string }[]
  assuntos: { id: string; name: string; materia_id: string }[]
  erro?: CadernoErro | null
  onClose: () => void
}

const normalizar = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
const campo = 'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100'

export default function CadernoForm({ materias, assuntos, erro, onClose }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const initialAssunto = assuntos.find(a => a.id === erro?.assunto_id && a.materia_id === erro?.materia_id)
  const [saving, setSaving] = useState(false)
  const [materiaId, setMateriaId] = useState(erro?.materia_id || '')
  const [assuntoId, setAssuntoId] = useState(initialAssunto?.id || '')
  const [assuntoBusca, setAssuntoBusca] = useState(initialAssunto?.name || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeOption, setActiveOption] = useState(0)
  const [motivo, setMotivo] = useState<MotivoErro | ''>((MOTIVOS_ERRO as readonly string[]).includes(erro?.motivo_erro || '') ? erro?.motivo_erro as MotivoErro : '')
  const [enunciado, setEnunciado] = useState(erro?.enunciado || '')
  const [resposta, setResposta] = useState(erro?.resposta_correta || '')
  const [origem, setOrigem] = useState(erro?.origem_questao || '')
  const [confianca, setConfianca] = useState<Confianca | ''>((CONFIANCAS as readonly string[]).includes(erro?.confianca || '') ? erro?.confianca as Confianca : '')
  const opcoes = assuntos.filter(a => a.materia_id === materiaId)
  const resultados = opcoes.filter(a => normalizar(a.name).includes(normalizar(assuntoBusca.trim())))
  const selecionarAssunto = (assunto: Props['assuntos'][number]) => {
    setAssuntoId(assunto.id)
    setAssuntoBusca(assunto.name)
    setShowSuggestions(false)
  }

  const save = async () => {
    if (!materiaId || !assuntoId || !motivo || !enunciado.trim() || !resposta.trim()) {
      return toast('Preencha matéria, assunto, motivo, questão e resolução/aprendizado.', 'error')
    }
    const input: ErroInput = {
      materia_id: materiaId, assunto_id: assuntoId, motivo_erro: motivo,
      enunciado, resposta_correta: resposta, origem_questao: origem || null, confianca: confianca || null,
    }
    setSaving(true)
    try {
      const result = await saveCadernoErro(input, erro?.id)
      if (result.error) return toast(result.error, 'error')
      toast(erro ? 'Erro atualizado.' : 'Erro registrado. Primeira revisão amanhã.', 'success')
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
        <div><h2 className="text-xl font-bold text-slate-900">{erro ? 'Editar erro' : 'Registrar erro'}</h2><p className="mt-1 text-sm text-slate-500">{erro ? 'Complete os dados para manter uma revisão útil.' : 'A primeira revisão será amanhã.'}</p></div>
        <button onClick={onClose} aria-label="Fechar" className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100">✕</button>
      </div>
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">Matéria *
          <select value={materiaId} onChange={e => { setMateriaId(e.target.value); setAssuntoId(''); setAssuntoBusca(''); setShowSuggestions(false); setActiveOption(0) }} className={campo}>
            <option value="">Selecione a matéria</option>{materias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <div className="relative text-sm font-semibold text-slate-700">
          <label htmlFor="assunto-caderno">Assunto *</label>
          <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
            <Search className="ml-3 h-4 w-4 text-slate-400" />
            <input id="assunto-caderno" role="combobox" aria-expanded={showSuggestions} aria-controls="assuntos-caderno" aria-autocomplete="list" aria-activedescendant={showSuggestions && resultados.length ? `assunto-opcao-${activeOption}` : undefined} disabled={!materiaId} value={assuntoBusca} onFocus={() => setShowSuggestions(true)} onChange={e => { setAssuntoBusca(e.target.value); setAssuntoId(''); setActiveOption(0); setShowSuggestions(true) }} onKeyDown={e => {
              if (e.key === 'Escape') setShowSuggestions(false)
              if (e.key === 'ArrowDown' && resultados.length) { e.preventDefault(); setShowSuggestions(true); setActiveOption(i => (i + 1) % resultados.length) }
              if (e.key === 'ArrowUp' && resultados.length) { e.preventDefault(); setShowSuggestions(true); setActiveOption(i => (i - 1 + resultados.length) % resultados.length) }
              if (e.key === 'Enter' && showSuggestions && resultados[activeOption]) { e.preventDefault(); selecionarAssunto(resultados[activeOption]) }
            }} placeholder={materiaId ? 'Pesquise um assunto cadastrado' : 'Escolha a matéria primeiro'} className="w-full bg-transparent p-3 font-normal outline-none disabled:text-slate-400" />
          </div>
          {assuntoId && <p className="mt-1 text-xs font-normal text-primary-700">Assunto selecionado</p>}
          {materiaId && showSuggestions && <div id="assuntos-caderno" role="listbox" className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            {resultados.length ? resultados.map((a, index) => <button id={`assunto-opcao-${index}`} type="button" role="option" aria-selected={assuntoId === a.id} key={a.id} onClick={() => selecionarAssunto(a)} className={`w-full rounded-lg px-3 py-2 text-left font-medium text-slate-700 hover:bg-primary-50 ${index === activeOption ? 'bg-primary-50' : ''}`}>{a.name}</button>) : <p className="p-3 font-normal text-slate-600">{opcoes.length ? 'Nenhum assunto corresponde à busca.' : 'Esta matéria ainda não tem assuntos.'} Gerencie assuntos em Minhas Matérias.</p>}
          </div>}
        </div>
        <label className="block text-sm font-semibold text-slate-700">Motivo do erro *
          <select value={motivo} onChange={e => setMotivo(e.target.value as MotivoErro)} className={campo}>
            <option value="">Selecione o motivo</option>{MOTIVOS_ERRO.map(m => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">Questão ou enunciado *
          <textarea value={enunciado} onChange={e => setEnunciado(e.target.value)} rows={3} placeholder="Cole a questão ou descreva a referência para tentar novamente" className={campo} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Resolução / aprendizado *
          <textarea value={resposta} onChange={e => setResposta(e.target.value)} rows={3} placeholder="Registre a resposta e o raciocínio que precisa lembrar" className={campo} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Origem / banca <span className="font-normal text-slate-500">(opcional)</span>
          <input value={origem} onChange={e => setOrigem(e.target.value)} placeholder="Ex.: ENEM 2025, Vunesp, lista do cursinho" className={campo} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Confiança ao responder <span className="font-normal text-slate-500">(opcional)</span>
          <select value={confianca} onChange={e => setConfianca(e.target.value as Confianca | '')} className={campo}>
            <option value="">Não informada</option>{CONFIANCAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-xl px-4 py-2 font-semibold text-slate-600">Cancelar</button>
        <button onClick={save} disabled={saving} className="rounded-xl bg-primary-600 px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar erro'}</button>
      </div>
    </section>
  </div>
}
