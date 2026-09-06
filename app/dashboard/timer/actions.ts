'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type TimerMode = 'chronometer' | 'pomodoro'
export type SessionSource = 'timer' | 'manual'

// Helpers de validação numérica estrita
const isStrictPositiveInt = (v: any) => typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v > 0;
const isStrictNonNegativeInt = (v: any) => typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v >= 0;

export async function saveTimerSession(data: {
  materia_id: string | null
  assunto_id: string | null
  duration_seconds: number
  questions_total: number
  questions_wrong: number
  session_date: string
  source: SessionSource
  timer_mode?: TimerMode
  pomodoro_cycles?: number
  started_at?: string | null
  ended_at?: string | null
}) {
  // 1. Validação estrita de Tipos e Valores no Servidor
  if (!data.materia_id) {
    return { error: 'Matéria é obrigatória.' }
  }

  if (!isStrictPositiveInt(data.duration_seconds)) {
    return { error: 'A duração da sessão deve ser um número inteiro maior que zero.' }
  }

  if (!isStrictNonNegativeInt(data.questions_total) || !isStrictNonNegativeInt(data.questions_wrong)) {
    return { error: 'A quantidade de questões deve ser um número inteiro válido (maior ou igual a zero).' }
  }

  if (data.questions_wrong > data.questions_total) {
    return { error: 'O número de questões erradas não pode ser maior que o total.' }
  }
  
  if (data.pomodoro_cycles !== undefined && data.pomodoro_cycles !== null && !isStrictNonNegativeInt(data.pomodoro_cycles)) {
    return { error: 'Os ciclos Pomodoro devem ser um número inteiro não negativo.' }
  }

  // Validação em runtime de enums
  if (data.source !== 'timer' && data.source !== 'manual') {
    return { error: 'Origem da sessão inválida.' }
  }

  if (data.timer_mode && data.timer_mode !== 'chronometer' && data.timer_mode !== 'pomodoro') {
    return { error: 'Modo do timer inválido.' }
  }

  // Validação de Data (Formato YYYY-MM-DD e validade real)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!data.session_date || !dateRegex.test(data.session_date) || Number.isNaN(Date.parse(data.session_date))) {
    return { error: 'Data da sessão inválida.' }
  }

  // Validação de Timestamps
  if (data.started_at) {
    const startNum = Date.parse(data.started_at);
    if (Number.isNaN(startNum)) return { error: 'Data de início inválida.' }
    if (data.ended_at) {
      const endNum = Date.parse(data.ended_at);
      if (Number.isNaN(endNum)) return { error: 'Data de término inválida.' }
      if (endNum < startNum) return { error: 'A data de término não pode ser anterior à data de início.' }
    }
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Erro de autenticação:', userError?.message)
    return { error: 'Usuário não autenticado' }
  }

  // 2. Validação de Existência e Posse: Matéria
  const { data: materiaCheck, error: materiaError } = await supabase
    .from('materias')
    .select('id')
    .eq('id', data.materia_id)
    // O RLS garante que ele só vai achar a matéria se for do usuário
    .single()

  if (materiaError || !materiaCheck) {
    console.error('Tentativa de salvar com matéria inválida ou inacessível:', materiaError?.message)
    return { error: 'Matéria inválida ou inexistente.' } // FAIL CLOSED
  }

  // 3. Verificação de consistência: Assunto existe e pertence à Matéria?
  if (data.assunto_id) {
    const { data: assuntoCheck, error: assuntoError } = await supabase
      .from('assuntos')
      .select(`
        id,
        topicos!inner (
          materia_id
        )
      `)
      .eq('id', data.assunto_id)
      .single()

    if (assuntoError || !assuntoCheck) {
      console.error('Tentativa de salvar com assunto inválido:', assuntoError?.message)
      return { error: 'Assunto inválido ou inexistente.' } // FAIL CLOSED
    }
    
    if ((assuntoCheck.topicos as any)?.materia_id !== data.materia_id) {
      console.error(`Assunto ${data.assunto_id} não pertence à matéria ${data.materia_id}.`)
      return { error: 'Inconsistência: Este assunto não pertence à matéria selecionada.' } // FAIL CLOSED
    }
  }

  // 4. Semântica de Retrocompatibilidade (Preservando legados)
  const correctQuestions = data.questions_total - data.questions_wrong

  const { error } = await supabase.from('study_sessions').insert({
    user_id: user.id,
    materia_id: data.materia_id,
    assunto_id: data.assunto_id,
    duration_seconds: data.duration_seconds,
    questions_total: data.questions_total,
    questions_wrong: data.questions_wrong,
    questions_done: correctQuestions,
    session_date: data.session_date,
    source: data.source,
    timer_mode: data.timer_mode || null,
    pomodoro_cycles: data.pomodoro_cycles || 0,
    started_at: data.started_at || null,
    ended_at: data.ended_at || null,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Erro ao salvar sessão no timer:', error.message)
    return { error: 'Ocorreu um erro interno ao salvar. Tente novamente.' }
  }

  revalidatePath('/dashboard/timer')
  return { success: true }
}

export async function getTimerHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Usuário não autenticado', data: [] }
  }

  const { data, error } = await supabase
    .from('study_sessions')
    .select(`
      id,
      duration_seconds,
      questions_total,
      questions_done,
      questions_wrong,
      session_date,
      source,
      timer_mode,
      materia_id,
      assunto_id,
      materias ( name ),
      assuntos ( name )
    `)
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar histórico do timer:', error.message)
    return { error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function deleteTimerSession(id: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Usuário não autenticado' }
  }

  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Erro ao excluir sessão do timer:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/timer')
  return { success: true }
}