import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    
    // Troca o hash do e-mail por uma sessão de usuário ativa
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se o link for inválido ou tiver expirado, envia de volta ao login
  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}