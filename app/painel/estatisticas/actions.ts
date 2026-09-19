'use server'

import { createClient } from '@/utils/supabase/server'
import { dataTimestampBrasil, janela, somarDiasCivis, type AssuntoDesempenho, type ErroDesempenho, type Periodo, type SessaoDesempenho } from '@/lib/desempenho'

type Client = Awaited<ReturnType<typeof createClient>>
const TAMANHO_PAGINA = 1000
const materiaDoTopico = (topico: { materia_id: string }[] | { materia_id: string } | null) =>
  Array.isArray(topico) ? topico[0]?.materia_id || '' : topico?.materia_id || ''

async function carregarSessoes(supabase: Client, userId: string, inicio: string | null) {
  const rows: SessaoDesempenho[] = []
  for (let offset = 0; ; offset += TAMANHO_PAGINA) {
    let query = supabase.from('study_sessions')
      .select('session_date, created_at, duration_seconds, questions_total, questions_done, questions_wrong, materia_id, assunto_id')
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

async function carregarAssuntos(supabase: Client, userId: string) {
  const rows: AssuntoDesempenho[] = []
  for (let offset = 0; ; offset += TAMANHO_PAGINA) {
    const { data, error } = await supabase.from('assuntos').select('id, name, topicos(materia_id)')
      .eq('user_id', userId).order('id', { ascending: true }).range(offset, offset + TAMANHO_PAGINA - 1)
    if (error) return { error: error.message }
    rows.push(...(data || []).map(a => ({
      id: a.id, name: a.name,
      materia_id: materiaDoTopico(a.topicos),
    })).filter(a => !!a.materia_id))
    if (!data || data.length < TAMANHO_PAGINA) break
  }
  return { data: rows }
}

export async function getDesempenho(periodo: Periodo) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Usuário não autenticado.' }
  const limites = janela(periodo)
  const inicioAno = `${limites.fim.slice(0, 4)}-01-01`
  const inicioSessoes = limites.anteriorInicio && limites.anteriorInicio < inicioAno ? limites.anteriorInicio : inicioAno
  const [sessoes, materias, assuntos, erros] = await Promise.all([
    carregarSessoes(supabase, user.id, periodo === 'all' ? null : inicioSessoes),
    supabase.from('materias').select('id, name').eq('user_id', user.id).order('name'),
    carregarAssuntos(supabase, user.id),
    carregarErros(supabase, user.id, limites.inicio),
  ])
  if (sessoes.error) return { error: `Sessões: ${sessoes.error}` }
  if (materias.error) return { error: `Matérias: ${materias.error.message}` }
  if (assuntos.error) return { error: `Assuntos: ${assuntos.error}` }
  if (erros.error) return { error: `Caderno: ${erros.error}` }
  return {
    data: {
      periodo, limites,
      sessoes: (sessoes.data || []).filter(s => {
        const date = s.session_date || (s.created_at ? dataTimestampBrasil(s.created_at) : null)
        return !!date && date <= limites.fim
      }),
      materias: materias.data || [],
      assuntos: assuntos.data || [],
      erros: (erros.data || []).filter(e => dataTimestampBrasil(e.created_at) <= limites.fim),
    },
  }
}
