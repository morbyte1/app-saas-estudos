import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // O parâmetro 'next' define para onde o usuário vai após autenticar o link
  // (ex: /login/reset-password ou /dashboard por padrão)
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se o link expirar ou for inválido, redireciona para o login
  return NextResponse.redirect(`${origin}/login`)
}