'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { MOTIVOS_ERRO, CONFIANCAS, dataLocal, somarDias, type CadernoErro, type CadernoRevisao, type ErroInput } from '@/lib/caderno'

function materiaDoTopico(topicos: { materia_id: string }[] | { materia_id: string } | null) {
  return Array.isArray(topicos) ? topicos[0]?.materia_id : topicos?.materia_id
}

export async function getCadernoData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }
  const [erros, revisoes, materias, assuntos] = await Promise.all([
    supabase.from('caderno_erros').select('*, materias(name), assuntos(name)').eq('user_id', user.id).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('caderno_revisoes').select('id, erro_id, reviewed_at, resultado, motivo_erro, confianca, caderno_erros!inner(id)').eq('user_id', user.id).is('caderno_erros.deleted_at', null).order('reviewed_at', { ascending: false }),
    supabase.from('materias').select('id, name').eq('user_id', user.id).order('name'),
    supabase.from('assuntos').select('id, name, topicos(materia_id)').eq('user_id', user.id).order('name'),
  ])
  const error = erros.error || revisoes.error || materias.error || assuntos.error
  if (error) return { error: error.message }
  return {
    success: true,
    data: {
      erros: (erros.data || []) as CadernoErro[],
      revisoes: (revisoes.data || []) as CadernoRevisao[],
      materias: materias.data || [],
      assuntos: (assuntos.data || []).map(a => ({ id: a.id, name: a.name, materia_id: materiaDoTopico(a.topicos) || '' })),
    },
  }
}

async function validateInput(userId: string, input: ErroInput) {
  if (!input.materia_id || !input.assunto_id || !MOTIVOS_ERRO.includes(input.motivo_erro)) return { error: 'Informe matéria, assunto e motivo válidos.' }
  if (!input.enunciado.trim() || !input.resposta_correta.trim()) return { error: 'Informe a questão e a resolução/aprendizado.' }
  if (input.confianca && !CONFIANCAS.includes(input.confianca)) return { error: 'Confiança inválida.' }
  const supabase = await createClient()
  const { data: materia, error } = await supabase.from('materias').select('id').eq('id', input.materia_id).eq('user_id', userId).maybeSingle()
  if (error) return { error: `Não foi possível validar a matéria: ${error.message}` }
  if (!materia) return { error: 'Matéria não encontrada.' }
  const { data: assunto, error: assuntoError } = await supabase.from('assuntos').select('id, name, topicos(materia_id)').eq('id', input.assunto_id).eq('user_id', userId).maybeSingle()
  if (assuntoError) return { error: `Não foi possível validar o assunto: ${assuntoError.message}` }
  if (!assunto || materiaDoTopico(assunto.topicos) !== input.materia_id) return { error: 'Assunto não pertence à matéria selecionada.' }
  return { assuntoName: assunto.name }
}

export async function saveCadernoErro(input: ErroInput, id?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }
  const validation = await validateInput(user.id, input)
  if (validation.error) return { error: validation.error }
  const payload = {
    materia_id: input.materia_id,
    assunto_id: input.assunto_id,
    assunto_texto: validation.assuntoName,
    motivo_erro: input.motivo_erro,
    enunciado: input.enunciado.trim(),
    resposta_correta: input.resposta_correta.trim(),
    origem_questao: input.origem_questao?.trim() || null,
    confianca: input.confianca || null,
  }
  const result = id
    ? await supabase.from('caderno_erros').update(payload).eq('id', id).eq('user_id', user.id).is('deleted_at', null).select('id').maybeSingle()
    : await supabase.from('caderno_erros').insert({ ...payload, motivo_erro_original: input.motivo_erro, user_id: user.id, status: 'revisar', estado: 'ativo', nivel_revisao: 0, proxima_revisao: somarDias(dataLocal(), 1), erros_recorrentes_count: 0 }).select('id').maybeSingle()
  if (result.error) return { error: result.error.message }
  if (!result.data) return { error: 'Erro não encontrado.' }
  revalidatePath('/painel/caderno')
  return { success: true }
}

export async function deleteCadernoErro(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }
  const { data, error } = await supabase.from('caderno_erros').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).is('deleted_at', null).select('id').maybeSingle()
  if (error || !data) return { error: error?.message || 'Erro não encontrado.' }
  revalidatePath('/painel/caderno')
  return { success: true }
}

export async function reviewCadernoErro(id: string, acertou: boolean, motivo?: string | null, confianca?: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }
  if (motivo && !MOTIVOS_ERRO.includes(motivo as typeof MOTIVOS_ERRO[number])) return { error: 'Motivo inválido.' }
  if (confianca && !CONFIANCAS.includes(confianca as typeof CONFIANCAS[number])) return { error: 'Confiança inválida.' }
  const { error } = await supabase.rpc('registrar_revisao_caderno', {
    p_erro_id: id, p_acertou: acertou, p_motivo: motivo || null, p_confianca: confianca || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/painel/caderno')
  return { success: true }
}
