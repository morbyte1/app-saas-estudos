import { getMateriaByName, getTopicosEAssuntos } from './actions'
import TopicsManager from '@/components/TopicsManager'
import { redirect } from 'next/navigation'

export default async function MateriaDetalhesPage({
  params
}: {
  params: { materia: string }
}) {
  // Busca a matéria pelo nome na URL
  const { materia, error: materiaError } = await getMateriaByName(params.materia)
  
  if (materiaError || !materia) {
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