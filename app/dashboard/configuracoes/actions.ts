'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(fullName: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName }
  })
  
  if (error) return { error: error.message }
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function updateUserEmail(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ email })
  
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateUserPassword(password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  
  if (error) return { error: error.message }
  return { success: true }
}