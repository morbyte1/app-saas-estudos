'use server'

import { createClient } from '@/utils/supabase/server'
import { dataTimestampBrasil, janela, somarDiasCivis, type ErroDesempenho, type Periodo, type SessaoDesempenho } from '@/lib/desempenho'

type Client = Awaited<ReturnType<typeof createClient>>
const TAMANHO_PAGINA = 1000

async function carregarSessoes(supabase: Client, userId: string, inicio: string | null) {
  const rows: SessaoDesempenho[] = []
  for (let offset = 0; ; offset += TAMANHO_PAGINA) {
    let query = supabase.from('study_sessions')
      .select('session_date, created_at, duration_seconds, questions_total, questions_done, questions_wrong, materia_id')
      .eq('user_id', userId).order('created_at', { ascending: true }).order('id', { ascending: true }).range(offset, offset + TAMANHO_PAGINA - 1)
    // Inclui sessões legadas sem session_date dentro de uma margem UTC; o filtro local exato ocorre depois.
    if (inicio) query = query.or(`session_date.gte.${inicio},and(session_date.is.null,created_at.gte.${somarDiasCivis(inicio, -1)}T00:00:00Z)`)
    const { data, error } = await query
    if (error) return { error: error.message }
    rows.push(...(data || []))
    if (!data || data.length < TAMANHO_PAGINA) break
  }
  return { data: rows }
}

async function carregarErros(supabase: Client, userId: string, inicio: string | null) {
  const rows: ErroDesempenho[] = []
  for (let offset = 0; ; offset += TAMANHO_PAGINA) {
    let query = supabase.from('caderno_erros')
      .select('materia_id, assunto_id, assunto_texto, motivo_erro, estado, erros_recorrentes_count, created_at, assuntos(name)')
      .eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: true }).order('id', { ascending: true }).range(offset, offset + TAMANHO_PAGINA - 1)
    // Um dia extra evita perder registros no limite UTC antes do filtro local exato.
    if (inicio) query = query.gte('created_at', `${somarDiasCivis(inicio, -1)}T00:00:00Z`)
    const { data, error } = await query
    if (error) return { error: error.message }
    rows.push(...((data || []).map(e => ({ ...e, assuntos: Array.isArray(e.assuntos) ? e.assuntos[0] || null : e.assuntos })) as ErroDesempenho[]))
    if (!data || data.length < TAMANHO_PAGINA) break
  }
  return { data: rows }
}

export async function getDesempenho(periodo: Periodo) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado.' }
  const limites = janela(periodo)
  const [sessoes, materias, erros] = await Promise.all([
    carregarSessoes(supabase, user.id, limites.anteriorInicio),
    supabase.from('materias').select('id, name').eq('user_id', user.id).order('name'),
    carregarErros(supabase, user.id, limites.inicio),
  ])
  if (sessoes.error) return { error: `Sessões: ${sessoes.error}` }
  if (materias.error) return { error: `Matérias: ${materias.error.message}` }
  if (erros.error) return { error: `Caderno: ${erros.error}` }
  return {
    data: {
      periodo, limites,
      sessoes: (sessoes.data || []).filter(s => {
        const date = s.session_date || (s.created_at ? dataTimestampBrasil(s.created_at) : null)
        return !!date && date <= limites.fim
      }),
      materias: materias.data || [],
      erros: (erros.data || []).filter(e => dataTimestampBrasil(e.created_at) <= limites.fim),
    },
  }
}
