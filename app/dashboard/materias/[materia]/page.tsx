import { getMateriaByName, getTopicosEAssuntos } from './actions'
import TopicsManager from '@/components/TopicsManager'
import { redirect } from 'next/navigation'

export default async function MateriaDetalhesPage({
  params
}: {
  params: Promise<{ materia: string }>
}) {
  // 1. Aguarda a resolução dos parâmetros (Obrigatório no Next.js 16)
  const resolvedParams = await params
  
  // 2. Garante que o nome da matéria não venha com caracteres de URL (%20, %C3)
  const materiaName = decodeURIComponent(resolvedParams.materia)

  // 3. Busca a matéria no banco
  const { materia, error: materiaError } = await getMateriaByName(materiaName)
  
  // Se houver erro ou não encontrar a matéria, redireciona de volta
  if (materiaError || !materia) {
    console.error("Matéria não encontrada ou erro:", materiaError)
    redirect('/dashboard/materias')
  }

  // Busca Tópicos e Assuntos relacionados a essa matéria
  const { topicos, assuntos } = await getTopicosEAssuntos(materia.id)

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <TopicsManager 
          materia={materia} 
          initialTopicos={topicos || []} 
          initialAssuntos={assuntos || []} 
        />
      </div>
    </div>
  )
}