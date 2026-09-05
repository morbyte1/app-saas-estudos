'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCadernoErros() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado', data: [] }

  const { data, error } = await supabase
    .from('caderno_erros')
    .select(`
      *,
      materias(name),
      assuntos(name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { success: true, data: data || [] }
}

export async function getTodosAssuntos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado', data: [] }

  const { data, error } = await supabase
    .from('assuntos')
    .select('id, name, materia_id')
    .eq('user_id', user.id)

  if (error) return { error: error.message, data: [] }
  return { success: true, data: data || [] }
}

export async function createQuestaoErro(data: {
  materia_id: string
  assunto_id: string
  enunciado: string
  resposta_correta: string
  motivo_erro: string
  confianca: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase.from('caderno_erros').insert({
    user_id: user.id,
    materia_id: data.materia_id,
    assunto_id: data.assunto_id,
    enunciado: data.enunciado,
    resposta_correta: data.resposta_correta,
    motivo_erro: data.motivo_erro,
    confianca: data.confianca,
    status: 'revisar'
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/caderno')
  return { success: true }
}

export async function editQuestaoErro(id: string, data: {
  materia_id: string
  assunto_id: string
  enunciado: string
  resposta_correta: string
  motivo_erro: string
  confianca: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase
    .from('caderno_erros')
    .update({
      materia_id: data.materia_id,
      assunto_id: data.assunto_id,
      enunciado: data.enunciado,
      resposta_correta: data.resposta_correta,
      motivo_erro: data.motivo_erro,
      confianca: data.confianca
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/caderno')
  return { success: true }
}

export async function deleteQuestaoErro(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase
    .from('caderno_erros')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/caderno')
  return { success: true }
}

export async function handleRevisaoQuestao(
  id: string, 
  acertou: boolean, 
  novoMotivo?: string, 
  novaConfianca?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { data: questao, error: fetchError } = await supabase
    .from('caderno_erros')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !questao) return { error: 'Questão não encontrada' }

  const today = new Date()

  if (acertou) {
    const novoNivel = (questao.nivel_revisao || 0) + 1
    
    if (novoNivel >= 4) {
      await supabase.from('caderno_erros').delete().eq('id', id).eq('user_id', user.id)
    } else {
      let dias = 3
      if (novoNivel === 2) dias = 7
      if (novoNivel === 3) dias = 21
      
      const proxima = new Date(today)
      proxima.setDate(today.getDate() + dias)

      await supabase.from('caderno_erros').update({
        nivel_revisao: novoNivel,
        proxima_revisao: proxima.toISOString().split('T')[0]
      }).eq('id', id)
    }
  } else {
    const proxima = new Date(today)
    proxima.setDate(today.getDate() + 1)

    await supabase.from('caderno_erros').update({
      nivel_revisao: 0,
      erros_recorrentes_count: (questao.erros_recorrentes_count || 0) + 1,
      proxima_revisao: proxima.toISOString().split('T')[0],
      motivo_erro: novoMotivo || questao.motivo_erro,
      confianca: novaConfianca || questao.confianca
    }).eq('id', id)
  }

  revalidatePath('/dashboard/caderno')
  return { success: true }
}