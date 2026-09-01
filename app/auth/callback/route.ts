import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? searchParams.get('redirect_to') ?? '/dashboard'

  if (token_hash && type) {
    const confirmUrl = new URL('/auth/confirmar', origin)
    confirmUrl.searchParams.set('token_hash', token_hash)
    confirmUrl.searchParams.set('type', type)
    confirmUrl.searchParams.set('next', next)
    
    return NextResponse.redirect(confirmUrl)
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}