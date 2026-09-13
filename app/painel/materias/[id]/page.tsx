import { getMateriaById, getTopicosEAssuntos, getMateriaSessions } from './actions'
import MateriaView from '@/components/MateriaView'
import { redirect } from 'next/navigation'

export default async function MateriaDetalhesPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // 1. Aguarda a resolução dos parâmetros (Obrigatório no Next.js 16)
  const resolvedParams = await params

  // 2. Busca a matéria no banco pelo ID
  const { materia, error: materiaError } = await getMateriaById(resolvedParams.id)
  
  // Se houver erro ou não encontrar a matéria, redireciona de volta
  if (materiaError || !materia) {
    console.error("Matéria não encontrada ou erro:", materiaError)
    redirect('/dashboard/materias')
  }

  // 3. Busca Tópicos, Assuntos e o histórico real da matéria
  const [dadosConteudo, dadosSessao] = await Promise.all([
    getTopicosEAssuntos(materia.id),
    getMateriaSessions(materia.id)
  ])

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <MateriaView 
          materia={materia} 
          initialTopicos={dadosConteudo.topicos || []} 
          initialAssuntos={dadosConteudo.assuntos || []} 
          sessions={dadosSessao.sessions || []}
        />
      </div>
    </div>
  )
}