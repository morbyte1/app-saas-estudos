export const mapMateriaToArea = (nome: string): string => {
  const norm = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  if (norm.includes('matematica')) return 'matematica'
  if (['fisica', 'quimica', 'biologia', 'natureza'].some(a => norm.includes(a))) return 'natureza'
  if (['historia', 'geografia', 'filosofia', 'sociologia', 'humanas'].some(a => norm.includes(a))) return 'humanas'
  if (['portugues', 'literatura', 'ingles', 'espanhol', 'artes', 'linguagens'].some(a => norm.includes(a))) return 'linguagens'
  if (norm.includes('redacao')) return 'redacao'
  return 'outros'
}