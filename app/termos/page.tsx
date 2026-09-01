import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>
        
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Termos de Uso</h1>
        
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <p><strong>Última atualização:</strong> Setembro de 2026</p>
          
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Aceitação dos Termos</h2>
            <p>Ao acessar e criar uma conta no Revyza, você concorda em cumprir estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não deve utilizar a plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Descrição do Serviço (Fase Beta)</h2>
            <p>O Revyza é uma plataforma de gestão e organização de estudos focada em métricas e cronogramas. Atualmente, a plataforma encontra-se em fase Beta (teste). Isso significa que o acesso é gratuito, mas o sistema pode passar por instabilidades, atualizações frequentes e mudanças de funcionalidades sem aviso prévio. A gratuidade das contas criadas nesta fase será mantida, mas recursos futuros podem ser cobrados à parte.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. Uso da Conta</h2>
            <p>Você é responsável por manter a confidencialidade da sua senha e pelas atividades que ocorrem na sua conta. O Revyza não se responsabiliza por perdas ou danos resultantes do uso não autorizado do seu perfil.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. Disponibilidade de Dados</h2>
            <p>Embora façamos o máximo para manter seus dados de estudo seguros e sincronizados, como estamos em fase Beta, recomendamos que você não dependa exclusivamente do Revyza como única fonte de backup crítico para a sua organização de reta final.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">5. Contato</h2>
            <p>Para dúvidas sobre estes termos, entre em contato através do e-mail suporte@revyza.com.br.</p>
          </section>
        </div>
      </div>
    </main>
  )
}