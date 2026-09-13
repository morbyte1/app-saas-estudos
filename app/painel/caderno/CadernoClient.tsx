'use client'

import { useState, useEffect } from 'react'
import { Flame, X, AlertTriangle, CheckCircle2, Pencil, Trash2, Calendar } from 'lucide-react'
import { useToast } from '@/components/ToastContext'
import ConfirmModal from '@/components/ConfirmModal'
import { createQuestaoErro, deleteQuestaoErro, editQuestaoErro, handleRevisaoQuestao } from './actions'

const MOTIVOS = ['Não sabia o conteúdo', 'Confundi conceitos', 'Descuido / Cálculo', 'Falta de atenção', 'Interpretação']
const CONFIANCAS = ['Baixa', 'Média', 'Alta']

interface CadernoClientProps {
  initialMaterias: { id: string; name: string }[]
  initialAssuntos: { id: string; name: string; materia_id: string }[]
  initialErros: any[]
}

export default function CadernoClient({ initialMaterias, initialAssuntos, initialErros }: CadernoClientProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'banco' | 'revisar'>('banco')
  const [erros, setErros] = useState(initialErros)
  const [isSaving, setIsSaving] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  // Estados do Modal de Exclusão
  const [questaoToDelete, setQuestaoToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Sincroniza o estado local com as atualizações do servidor
  useEffect(() => {
    setErros(initialErros)
  }, [initialErros])

  // Form State
  const [materiaId, setMateriaId] = useState('')
  const [assuntoId, setAssuntoId] = useState('')
  const [enunciado, setEnunciado] = useState('')
  const [resposta, setResposta] = useState('')
  const [motivo, setMotivo] = useState('')
  const [confianca, setConfianca] = useState('')

  // Review State
  const [reviewIndex, setReviewIndex] = useState(0)
  const [rascunho, setRascunho] = useState('')
  const [showGabarito, setShowGabarito] = useState(false)
  
  // Re-evaluation State
  const [isReevaluating, setIsReevaluating] = useState(false)
  const [novoMotivo, setNovoMotivo] = useState('')
  const [novaConfianca, setNovaConfianca] = useState('')

  const filteredAssuntos = initialAssuntos.filter(a => a.materia_id === materiaId)
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Hoje'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  const hojeStr = new Date().toISOString().split('T')[0]
  
  const pendentesRaw = erros.filter(e => {
    const dataRev = e.proxima_revisao || hojeStr
    return dataRev <= hojeStr
  })

  pendentesRaw.sort((a, b) => {
    if (a.confianca === 'Alta' && b.confianca !== 'Alta') return -1
    if (a.confianca !== 'Alta' && b.confianca === 'Alta') return 1
    
    const errA = a.erros_recorrentes_count || 0
    const errB = b.erros_recorrentes_count || 0
    return errB - errA
  })

  const pendentes: typeof erros = []
  const pool = [...pendentesRaw]
  let ultimaMateriaId: string | null = null

  while (pool.length > 0) {
    let idx = pool.findIndex(q => q.materia_id !== ultimaMateriaId)
    if (idx === -1) idx = 0 
    
    const q = pool.splice(idx, 1)[0]
    pendentes.push(q)
    ultimaMateriaId = q.materia_id
  }

  const questaoAtual = pendentes[0] 

  const resetForm = () => {
    setEditandoId(null); setMateriaId(''); setAssuntoId(''); 
    setEnunciado(''); setResposta(''); setMotivo(''); setConfianca('')
  }

  const handleEditClick = (erro: any) => {
    setEditandoId(erro.id)
    setMateriaId(erro.materia_id)
    setAssuntoId(erro.assunto_id)
    setEnunciado(erro.enunciado)
    setResposta(erro.resposta_correta)
    setMotivo(erro.motivo_erro)
    setConfianca(erro.confianca)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteClick = (id: string) => {
    setQuestaoToDelete(id)
  }

  const executeDeleteQuestao = async () => {
    if (!questaoToDelete) return
    setIsDeleting(true)
    
    const res = await deleteQuestaoErro(questaoToDelete)
    if (res.success) {
      toast('Questão excluída com sucesso!', 'success')
      setErros(erros.filter(e => e.id !== questaoToDelete))
      if (editandoId === questaoToDelete) resetForm()
    } else {
      toast('Erro ao excluir a questão.', 'error')
    }
    
    setIsDeleting(false)
    setQuestaoToDelete(null)
  }

  const handleSaveQuestao = async () => {
    if (!materiaId || !assuntoId || !enunciado || !resposta || !motivo || !confianca) {
      toast('Preencha todos os campos para salvar a questão.', 'error')
      return
    }

    setIsSaving(true)
    const payload = {
      materia_id: materiaId,
      assunto_id: assuntoId,
      enunciado,
      resposta_correta: resposta,
      motivo_erro: motivo,
      confianca
    }

    let res
    if (editandoId) {
      res = await editQuestaoErro(editandoId, payload)
    } else {
      res = await createQuestaoErro(payload)
    }

    if (res.success) {
      toast(editandoId ? 'Questão atualizada!' : 'Questão salva com sucesso!', 'success')
      resetForm()
      window.location.reload()
    } else {
      toast('Erro ao salvar a questão.', 'error')
    }
    setIsSaving(false)
  }

  const handleReviewAction = async (acertou: boolean) => {
    if (!questaoAtual) return

    if (acertou) {
      const amanha = new Date()
      amanha.setDate(amanha.getDate() + 1)
      setErros(erros.map(e => e.id === questaoAtual.id ? { ...e, proxima_revisao: amanha.toISOString().split('T')[0] } : e))
      
      await handleRevisaoQuestao(questaoAtual.id, true)
      avancarQuestao()
    } else {
      setNovoMotivo('')
      setNovaConfianca('')
      setIsReevaluating(true)
    }
  }

  const confirmarErro = async () => {
    if (!novoMotivo || !novaConfianca) {
      toast('Selecione o novo motivo e confiança.', 'error')
      return
    }

    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    setErros(erros.map(e => e.id === questaoAtual.id ? { 
      ...e, 
      proxima_revisao: amanha.toISOString().split('T')[0],
      motivo_erro: novoMotivo,
      confianca: novaConfianca
    } : e))

    await handleRevisaoQuestao(questaoAtual.id, false, novoMotivo, novaConfianca)
    setIsReevaluating(false)
    avancarQuestao()
  }

  const avancarQuestao = () => {
    setRascunho('')
    setShowGabarito(false)
    setReviewIndex(0)
  }

  return (
    <div className={`min-h-screen p-8 transition-colors ${activeTab === 'revisar' ? 'bg-primary-50' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* TABS HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'banco' ? 'Banco de Questões' : 'Revisar'}
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              {activeTab === 'banco' ? 'Gerencie seus erros e mapeie suas falhas' : 'Recupere o conteúdo na memória'}
            </p>
          </div>
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button
              onClick={() => { setActiveTab('banco'); resetForm(); }}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'banco' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Banco de Questões
            </button>
            <button
              onClick={() => { setActiveTab('revisar'); avancarQuestao(); }}
              className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'revisar' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Revisar
            </button>
          </div>
        </div>

        {activeTab === 'banco' && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ESQUERDA: LISTA */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="bg-primary-100 text-primary-700 rounded-2xl p-4 flex items-center gap-3 font-semibold shadow-sm">
                <Flame className="w-6 h-6" />
                Você tem {pendentes.length} questões prontas para revisar hoje
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {erros.map(erro => (
                  <div key={erro.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 group">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-md">
                          {erro.materias?.name} - {erro.assuntos?.name}
                        </span>
                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-md">
                          {erro.motivo_erro}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 transition-opacity">
                        <button onClick={() => handleEditClick(erro)} className="p-1.5 text-slate-400 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 rounded-lg transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(erro.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-slate-700 text-sm font-medium line-clamp-2">
                      {erro.enunciado}
                    </p>

                    <div className="flex items-center gap-2 mt-1 border-t border-slate-100 pt-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500 font-medium">Próxima revisão: <strong className="text-slate-700">{formatDate(erro.proxima_revisao)}</strong></span>
                      {erro.erros_recorrentes_count > 0 && (
                         <span className="text-xs text-amber-600 font-bold ml-2">• Errou {erro.erros_recorrentes_count}x</span>
                      )}
                    </div>
                  </div>
                ))}
                {erros.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-8">Nenhuma questão registrada ainda.</p>
                )}
              </div>
            </div>

            {/* DIREITA: NOVA/EDITAR QUESTÃO */}
            <div className="w-full lg:w-[450px] bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-fit sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">{editandoId ? 'Editar Questão' : 'Nova Questão'}</h2>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5"/></button>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Matéria</label>
                    <select
                      value={materiaId}
                      onChange={(e) => { setMateriaId(e.target.value); setAssuntoId(''); }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
                    >
                      <option value="">Selecione...</option>
                      {initialMaterias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Assunto</label>
                    <select
                      value={assuntoId}
                      onChange={(e) => setAssuntoId(e.target.value)}
                      disabled={!materiaId}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium disabled:opacity-50"
                    >
                      <option value="">Selecione...</option>
                      {filteredAssuntos.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Enunciado da Questão</label>
                  <textarea 
                    value={enunciado}
                    onChange={(e) => setEnunciado(e.target.value)}
                    className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 resize-none font-medium" 
                    placeholder="Cole aqui o texto da questão..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Resposta Correta e Explicação</label>
                  <textarea 
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 resize-none font-medium" 
                    placeholder="Explique o raciocínio correto..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Por que você errou?</label>
                  <div className="flex flex-wrap gap-2">
                    {MOTIVOS.map(m => (
                      <button
                        key={m}
                        onClick={() => setMotivo(m)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors border ${motivo === m ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-primary-600 border-primary-600 hover:bg-primary-50'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Qual era sua confiança ao responder?</label>
                  <div className="flex gap-2">
                    {CONFIANCAS.map(c => (
                      <button
                        key={c}
                        onClick={() => setConfianca(c)}
                        className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors border ${confianca === c ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-primary-600 border-primary-600 hover:bg-primary-50'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  className="flex-1 py-3 text-slate-700 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                  onClick={resetForm}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveQuestao}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {editandoId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revisar' && (
          <div className="flex items-center justify-center py-10">
            {pendentes.length === 0 ? (
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Tudo revisado!</h2>
                <p className="text-slate-500">Você não tem questões pendentes para revisar agora.</p>
              </div>
            ) : (
              <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="bg-amber-50 px-6 py-3 flex items-center gap-3 border-b border-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800 font-semibold">
                    Tenha cuidado, a última vez que você fez essa questão errou por: <span className="font-extrabold">{questaoAtual.motivo_erro}</span>.
                  </p>
                </div>
                
                <div className="p-8">
                  <span className="inline-block bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1.5 rounded-lg mb-6">
                    {questaoAtual.materias?.name} - {questaoAtual.assuntos?.name}
                  </span>
                  
                  <p className="text-lg text-slate-800 font-medium leading-relaxed mb-8 whitespace-pre-wrap">
                    {questaoAtual.enunciado}
                  </p>
                  
                  <hr className="border-slate-100 mb-8" />
                  
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Sua Recordação Ativa</h3>
                  <textarea
                    value={rascunho}
                    onChange={(e) => setRascunho(e.target.value)}
                    placeholder="Qual é a resposta e por quê? (Raciocínio mental opcional)"
                    className="w-full h-32 bg-transparent text-slate-700 text-base font-medium resize-none focus:outline-none placeholder:text-slate-300"
                  />

                  {!showGabarito ? (
                    <button 
                      onClick={() => setShowGabarito(true)}
                      className="w-full mt-4 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Ver Gabarito
                    </button>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-top-4">
                      <div className="bg-primary-50 p-6 rounded-2xl mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-5 h-5 text-primary-700" />
                          <h4 className="font-bold text-primary-700">Resposta Correta</h4>
                        </div>
                        <p className="text-primary-900 font-medium whitespace-pre-wrap">
                          {questaoAtual.resposta_correta}
                        </p>
                      </div>
                      
                      {!isReevaluating ? (
                        <div className="flex justify-end gap-4">
                          <button 
                            onClick={() => handleReviewAction(false)}
                            className="px-6 py-3 font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                          >
                            Errei
                          </button>
                          <button 
                            onClick={() => handleReviewAction(true)}
                            className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
                          >
                            Acertei o raciocínio
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 p-6 rounded-2xl animate-in zoom-in-95">
                          <h4 className="font-bold text-slate-900 mb-4 text-center">Vamos corrigir esse erro imediatamente.</h4>
                          
                          <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase text-center">Por que você errou agora?</label>
                            <div className="flex flex-wrap justify-center gap-2">
                              {MOTIVOS.map(m => (
                                <button
                                  key={m}
                                  onClick={() => setNovoMotivo(m)}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors border ${novoMotivo === m ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-primary-600 border-primary-600 hover:bg-primary-50'}`}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase text-center">Nova Confiança (antes de ler a resposta)</label>
                            <div className="flex justify-center gap-2">
                              {CONFIANCAS.map(c => (
                                <button
                                  key={c}
                                  onClick={() => setNovaConfianca(c)}
                                  className={`px-6 py-2 text-xs font-bold rounded-full transition-colors border ${novaConfianca === c ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-primary-600 border-primary-600 hover:bg-primary-50'}`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button 
                            onClick={confirmarErro}
                            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                          >
                            Confirmar Erro e Agendar para Amanhã
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <ConfirmModal
          isOpen={!!questaoToDelete}
          title="Excluir Questão"
          message="Tem certeza que deseja excluir esta questão do seu caderno de erros?"
          confirmText="Sim, excluir"
          onConfirm={executeDeleteQuestao}
          onCancel={() => setQuestaoToDelete(null)}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}