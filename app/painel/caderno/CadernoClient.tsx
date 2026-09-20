'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, CalendarDays, RotateCcw } from 'lucide-react'
import { useToast } from '@/components/ToastContext'
import ConfirmModal from '@/components/ConfirmModal'
import { assuntoDoErro, dataLocal, formatarData, podeRevisar, dadosRevisaoCompletos, type CadernoErro, type CadernoRevisao } from '@/lib/caderno'
import { deleteCadernoErro } from './actions'
import CadernoForm from './CadernoForm'
import ReviewFlow from './ReviewFlow'

interface Props {
  initialArea?: 'erros' | 'revisoes'
  erros: CadernoErro[]
  revisoes: CadernoRevisao[]
  materias: { id: string; name: string }[]
  assuntos: { id: string; name: string; materia_id: string }[]
}

export default function CadernoClient({ erros, revisoes, materias, assuntos, initialArea = 'erros' }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [area, setArea] = useState<'erros' | 'revisoes'>(initialArea)
  const [status, setStatus] = useState('todos')
  const [materia, setMateria] = useState('todas')
  const [busca, setBusca] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const hoje = dataLocal()

  const ativos = erros.filter(e => e.estado !== 'resolvido')
  const resolvidos = erros.filter(e => e.estado === 'resolvido')
  const devidos = ativos.filter(e => podeRevisar(e, hoje))
  const revisaveis = devidos.filter(dadosRevisaoCompletos)
  const vencidos = devidos.filter(e => e.proxima_revisao && e.proxima_revisao < hoje).sort((a, b) => (a.proxima_revisao || '').localeCompare(b.proxima_revisao || ''))
  const hojePendentes = devidos.filter(e => !e.proxima_revisao || e.proxima_revisao === hoje)
  const proximos = ativos.filter(e => e.proxima_revisao && e.proxima_revisao > hoje).sort((a, b) => (a.proxima_revisao || '').localeCompare(b.proxima_revisao || ''))
  const texto = busca.trim().toLocaleLowerCase('pt-BR')
  const filtrados = erros.filter(e => (status === 'todos' || (status === 'ativo' ? e.estado !== 'resolvido' : e.estado === 'resolvido'))
    && (materia === 'todas' || e.materia_id === materia)
    && (!texto || `${assuntoDoErro(e)} ${e.motivo_erro} ${e.enunciado || ''} ${e.resposta_correta || ''} ${e.origem_questao || ''}`.toLocaleLowerCase('pt-BR').includes(texto)))
  const detail = erros.find(e => e.id === detailId)
  const editing = erros.find(e => e.id === editingId)
  const reviewing = erros.find(e => e.id === reviewId)

  const remove = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const result = await deleteCadernoErro(deleteId)
      if (result.error) return toast(result.error, 'error')
      toast('Erro excluído.', 'success')
      setDeleteId(null)
      setDetailId(null)
      router.refresh()
    } catch {
      toast('Não foi possível excluir o erro. Tente novamente.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const errorCard = (erro: CadernoErro) => <button key={erro.id} onClick={() => setDetailId(erro.id)} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-primary-300">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-bold text-primary-700">{erro.materias?.name || materias.find(m => m.id === erro.materia_id)?.name || 'Matéria'} · {assuntoDoErro(erro)}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${erro.estado === 'resolvido' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{erro.estado === 'resolvido' ? 'Resolvido' : 'Em revisão'}</span>
    </div>
    <p className="mt-2 font-semibold text-slate-800">{erro.motivo_erro || 'Motivo não informado'}</p>
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      <span>Registrado em {formatarData(erro.created_at)}</span>
      {erro.estado !== 'resolvido' && <span>{dadosRevisaoCompletos(erro) ? `Próxima revisão: ${erro.proxima_revisao ? formatarData(erro.proxima_revisao) : 'disponível'}` : 'Complete os dados para revisar'}</span>}
      <span>{revisoes.filter(r => r.erro_id === erro.id).length} tentativa(s)</span>
      {!!erro.erros_recorrentes_count && <span>{erro.erros_recorrentes_count} falha(s) em revisões</span>}
    </div>
  </button>

  return <main className="min-h-screen bg-slate-50 p-4 pb-8 text-slate-900 sm:p-8">
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-extrabold">Caderno de Erros</h1><p className="mt-2 text-sm text-slate-600">Entenda seus erros e acompanhe o que ainda precisa corrigir.</p></div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 font-bold text-white"><Plus className="h-4 w-4" />Registrar erro</button>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center sm:gap-4">
        <div className="rounded-2xl bg-white p-3 shadow-sm"><strong className="block text-xl">{ativos.length}</strong><span className="text-xs text-slate-500">Ativos</span></div>
        <div className="rounded-2xl bg-white p-3 shadow-sm"><strong className="block text-xl">{revisaveis.length}</strong><span className="text-xs text-slate-500">Para revisar</span></div>
        <div className="rounded-2xl bg-white p-3 shadow-sm"><strong className="block text-xl">{resolvidos.length}</strong><span className="text-xs text-slate-500">Resolvidos</span></div>
      </div>

      <nav aria-label="Áreas do Caderno" className="mt-7 flex gap-2 border-b border-slate-200">
        <button onClick={() => setArea('erros')} className={`px-4 py-3 text-sm font-bold ${area === 'erros' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-slate-500'}`}>Meus erros</button>
        <button onClick={() => setArea('revisoes')} className={`px-4 py-3 text-sm font-bold ${area === 'revisoes' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-slate-500'}`}>Revisões</button>
      </nav>

      {area === 'erros' ? <section className="mt-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><Search className="h-4 w-4 text-slate-400" /><input aria-label="Buscar erros" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar assunto ou texto" className="w-full bg-transparent py-3 outline-none" /></label>
          <select aria-label="Filtrar status" value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2"><option value="todos">Todos os status</option><option value="ativo">Ativos</option><option value="resolvido">Resolvidos</option></select>
          <select aria-label="Filtrar matéria" value={materia} onChange={e => setMateria(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2"><option value="todas">Todas as matérias</option>{materias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        </div>
        <div className="mt-5 space-y-3">{filtrados.map(errorCard)}</div>
        {erros.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">Seu caderno começa com um erro que vale lembrar. Registre o primeiro quando quiser.</div>}
        {erros.length > 0 && filtrados.length === 0 && <p className="mt-6 text-center text-sm text-slate-500">Nenhum erro corresponde aos filtros.</p>}
      </section> : <section className="mt-5 space-y-7">
        {devidos.length === 0 && <div className="rounded-2xl border border-primary-100 bg-primary-50 p-6 text-slate-700">Nenhuma revisão pendente agora. Seus erros continuam disponíveis em Meus erros.</div>}
        {[{ title: 'Vencidas', items: vencidos }, { title: 'Para hoje', items: hojePendentes }, { title: 'Próximas', items: proximos }].map(group => group.items.length > 0 && <div key={group.title}>
          <h2 className="mb-3 text-lg font-bold">{group.title}</h2><div className="space-y-3">{group.items.map(erro => <div key={erro.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div><p className="font-semibold">{erro.materias?.name || 'Matéria'} · {assuntoDoErro(erro)}</p><p className="mt-1 text-xs text-slate-500">{erro.motivo_erro} · {erro.proxima_revisao ? formatarData(erro.proxima_revisao) : 'Disponível agora'}</p></div>
            {group.title !== 'Próximas' && (dadosRevisaoCompletos(erro) ? <button onClick={() => setReviewId(erro.id)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white"><RotateCcw className="h-4 w-4" />Revisar</button> : <button onClick={() => setEditingId(erro.id)} className="rounded-xl border border-primary-200 px-4 py-2 text-sm font-bold text-primary-700">Completar dados</button>)}
          </div>)}</div>
        </div>)}
      </section>}
    </div>

    {detail && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setDetailId(null)}><section role="dialog" aria-modal="true" aria-label="Detalhe do erro" onClick={e => e.stopPropagation()} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-primary-700">{detail.materias?.name || 'Matéria'} · {assuntoDoErro(detail)}</p><h2 className="mt-2 text-xl font-bold">{detail.motivo_erro}</h2></div><button aria-label="Fechar" onClick={() => setDetailId(null)}>✕</button></div>
      <p className="mt-3 text-sm text-slate-500">{detail.estado === 'resolvido' ? 'Resolvido' : 'Em revisão'} · Registrado em {formatarData(detail.created_at)}</p>
      {detail.confianca && <p className="mt-2 text-sm text-slate-600">Confiança registrada: {detail.confianca}</p>}
      {detail.origem_questao && <p className="mt-2 text-sm text-slate-600">Origem / banca: {detail.origem_questao}</p>}
      {detail.motivo_erro_original && <p className="mt-2 text-xs text-slate-500">Motivo original: {detail.motivo_erro_original}</p>}
      {detail.estado === 'ativo' && !dadosRevisaoCompletos(detail) && <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">Este registro antigo precisa de assunto, questão e resolução para uma revisão útil. Complete os dados em Editar.</p>}
      {detail.enunciado && <div className="mt-5 rounded-2xl bg-slate-50 p-4"><h3 className="text-xs font-bold uppercase text-slate-500">Questão ou referência</h3><p className="mt-2 whitespace-pre-wrap text-sm">{detail.enunciado}</p></div>}
      {detail.resposta_correta && <div className="mt-3 rounded-2xl bg-primary-50 p-4"><h3 className="text-xs font-bold uppercase text-primary-700">Aprendizado</h3><p className="mt-2 whitespace-pre-wrap text-sm">{detail.resposta_correta}</p></div>}
      <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600"><span><CalendarDays className="mr-1 inline h-4 w-4" />{detail.estado === 'resolvido' ? `Resolvido em ${formatarData(detail.resolvido_em)}` : `Próxima revisão: ${detail.proxima_revisao ? formatarData(detail.proxima_revisao) : 'disponível'}`}</span><span>{revisoes.filter(r => r.erro_id === detail.id).length} tentativa(s)</span><span>{detail.erros_recorrentes_count || 0} recorrência(s)</span></div>
      <h3 className="mt-6 font-bold">Histórico de revisões</h3>
      <div className="mt-2 space-y-2">{revisoes.filter(r => r.erro_id === detail.id).map(r => <p key={r.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="font-semibold">{formatarData(r.reviewed_at)}</span> — {r.resultado === 'acertou' ? 'acertei' : 'ainda errei'}{r.confianca ? ` · confiança ${r.confianca}` : ''}{r.motivo_erro ? ` · ${r.motivo_erro}` : ''}</p>)}{!revisoes.some(r => r.erro_id === detail.id) && <p className="text-sm text-slate-500">Nenhuma revisão registrada ainda.</p>}</div>
      <div className="mt-6 flex flex-wrap justify-end gap-3"><button onClick={() => { setEditingId(detail.id); setDetailId(null) }} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold">Editar</button><button onClick={() => setDeleteId(detail.id)} className="rounded-xl px-4 py-2 font-semibold text-red-600">Excluir</button>{podeRevisar(detail, hoje) && dadosRevisaoCompletos(detail) && <button onClick={() => { setReviewId(detail.id); setDetailId(null) }} className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white">Revisar</button>}</div>
    </section></div>}
    {(showNew || editing) && <CadernoForm key={editing?.id || 'new'} materias={materias} assuntos={assuntos} erro={editing} onClose={() => { setShowNew(false); setEditingId(null) }} />}
    {reviewing && <ReviewFlow key={reviewing.id} erro={reviewing} onClose={() => setReviewId(null)} />}
    <ConfirmModal isOpen={!!deleteId} title="Excluir erro" message="Este erro deixará de aparecer no seu Caderno. Deseja continuar?" confirmText="Excluir" onConfirm={remove} onCancel={() => setDeleteId(null)} isLoading={deleting} />
  </main>
}
