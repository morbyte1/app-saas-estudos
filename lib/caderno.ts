export const MOTIVOS_ERRO = [
  'Não sabia o conteúdo', 'Confundi conceitos', 'Interpretação',
  'Erro de cálculo/procedimento', 'Desatenção', 'Falta de tempo', 'Outro',
] as const
export const CONFIANCAS = ['Baixa', 'Média', 'Alta'] as const

export type MotivoErro = typeof MOTIVOS_ERRO[number]
export type Confianca = typeof CONFIANCAS[number]
export type EstadoErro = 'ativo' | 'resolvido'

export interface CadernoErro {
  id: string
  materia_id: string
  assunto_id: string | null
  assunto_texto: string | null
  motivo_erro: string // diagnóstico atual
  motivo_erro_original: string | null // motivo informado no cadastro inicial
  origem_questao: string | null
  deleted_at: string | null
  enunciado: string | null
  resposta_correta: string | null
  confianca: string | null
  created_at: string
  status: string | null
  estado: EstadoErro
  nivel_revisao: number | null
  proxima_revisao: string | null
  erros_recorrentes_count: number | null
  resolvido_em: string | null
  materias?: { name: string } | null
  assuntos?: { name: string } | null
}

export interface CadernoRevisao {
  id: number
  erro_id: string
  reviewed_at: string
  resultado: 'acertou' | 'errou'
  motivo_erro: string | null // diagnóstico informado nesta tentativa
  confianca: string | null
}

export interface ErroInput {
  materia_id: string
  assunto_id: string
  motivo_erro: MotivoErro
  enunciado: string
  resposta_correta: string
  origem_questao: string | null
  confianca: Confianca | null
}

export const assuntoDoErro = (erro: CadernoErro) => erro.assunto_texto || erro.assuntos?.name || 'Assunto não informado'
export const dataLocal = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date())
export const somarDias = (data: string, dias: number) => {
  const date = new Date(`${data}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + dias)
  return date.toISOString().slice(0, 10)
}
export const podeRevisar = (erro: CadernoErro, hoje = dataLocal()) =>
  erro.estado === 'ativo' && (!erro.proxima_revisao || erro.proxima_revisao <= hoje)
export const dadosRevisaoCompletos = (erro: CadernoErro) =>
  !!(erro.assunto_id && erro.enunciado?.trim() && erro.resposta_correta?.trim())
export const formatarData = (value: string | null | undefined) => {
  if (!value) return '—'
  const apenasData = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = new Date(apenasData ? `${value}T12:00:00Z` : value)
  return date.toLocaleDateString('pt-BR', { timeZone: apenasData ? 'UTC' : 'America/Sao_Paulo' })
}
