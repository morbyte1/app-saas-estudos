'use server'

import { createClient } from '@/utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export async function verifyTokenAction(token_hash: string, type: string, next: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash,
  })

  if (error) {
    return { error: 'Link inválido ou expirado. Por favor, solicite um novo acesso e certifique-se de abrir no mesmo dispositivo.' }
  }

  redirect(next)
}