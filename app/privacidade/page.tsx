import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>
        
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Política de Privacidade</h1>
        
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <p><strong>Última atualização:</strong> Setembro de 2026</p>
          
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Coleta de Dados</h2>
            <p>No Revyza, coletamos apenas o estritamente necessário para o funcionamento da plataforma. Quando você se cadastra, solicitamos seu Nome e E-mail. Durante o uso, armazenamos os dados que você insere voluntariamente: matérias, tempo de estudo, questões resolvidas, erros e cronograma.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Uso das Informações</h2>
            <p>Seus dados são usados exclusivamente para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Permitir o acesso seguro à sua conta;</li>
              <li>Gerar seus gráficos e estatísticas pessoais de estudo;</li>
              <li>Entrar em contato para fornecer suporte ou avisos importantes sobre o sistema (como atualizações da fase Beta).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. Compartilhamento de Dados</h2>
            <p>Seus dados pessoais <strong>nunca</strong> serão vendidos, alugados ou repassados a terceiros para fins de marketing. O armazenamento é feito utilizando a infraestrutura segura do Supabase e da Vercel, que seguem rigorosos padrões internacionais de segurança de dados.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. Exclusão e Controle dos Seus Dados</h2>
            <p>Você tem total controle sobre suas informações. Dentro do painel de Configurações, na seção "Zona de Perigo", você encontra a opção de excluir permanentemente a sua conta. Ao confirmar a exclusão, todos os seus dados pessoais, histórico de timer e cronograma são apagados irreversivelmente do nosso banco de dados em tempo real.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">5. Contato</h2>
            <p>Caso tenha dúvidas sobre como seus dados são tratados, você pode falar diretamente com o criador do projeto através do e-mail suporte@revyza.com.br.</p>
          </section>
        </div>
      </div>
    </main>
  )
}