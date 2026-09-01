'use server'

import { createClient } from '@/utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function verifyTokenAction(token_hash: string, type: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash,
  })

  if (error) {
    return { error: 'Link inválido ou já expirado. Por favor, solicite um novo acesso.' }
  }

  return { success: true }
}