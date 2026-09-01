import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // Fluxo 1: Autenticação via Link de E-mail (Signup e Recover Password)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fluxo 2: Fallback padrão para OAuth ou integrações externas
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se o código ou token forem inválidos/expirados
  return NextResponse.redirect(`${origin}/login?error=link_expirado`)
}