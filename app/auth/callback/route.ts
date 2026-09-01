import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Captura para onde o usuário deve ir após o SSR definir os cookies
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Cookies definidos com sucesso, libera para a página protegida
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Falha de segurança, link usado ou expirado
  return NextResponse.redirect(`${origin}/login`)
}