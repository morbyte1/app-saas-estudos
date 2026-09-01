import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    // Redireciona para uma página que exige interação humana para impedir
    // que scanners de e-mail consumam o token_hash acidentalmente via GET.
    const confirmUrl = new URL('/auth/confirmar', origin)
    confirmUrl.searchParams.set('token_hash', token_hash)
    confirmUrl.searchParams.set('type', type)
    confirmUrl.searchParams.set('next', next)
    
    return NextResponse.redirect(confirmUrl)
  }

  // Se o link for inválido ou não possuir os parâmetros mínimos, envia de volta ao login
  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}