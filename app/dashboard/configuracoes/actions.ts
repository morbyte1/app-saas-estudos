'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://revyza.com.br'}/auth/callback?next=/dashboard/configuracoes` }
  )
  
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateUserPassword(password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAccount(password: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user || !user.email) {
    return { error: 'Usuário não autenticado.' }
  }

  // Verifica a senha antes de permitir a exclusão
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password
  })

  if (signInError) {
    return { error: 'Senha incorreta. A exclusão não foi autorizada.' }
  }

  // Chama a função RPC para deletar o usuário no banco
  const { error: rpcError } = await supabase.rpc('delete_user')
  
  if (rpcError) {
    return { error: 'Erro ao excluir conta: ' + rpcError.message }
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}