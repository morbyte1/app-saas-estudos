import CadernoClient from './CadernoClient'
import { getCadernoData } from './actions'

export default async function CadernoErrosPage({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const [result, params] = await Promise.all([getCadernoData(), searchParams])
  if (!result.success || !result.data) {
    return <main className="p-6 text-slate-700">Não foi possível carregar o Caderno de Erros. {result.error}</main>
  }
  return <CadernoClient {...result.data} initialArea={params.area === 'revisoes' ? 'revisoes' : 'erros'} />
}
