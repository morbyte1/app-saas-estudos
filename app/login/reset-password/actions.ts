'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Preencha todos os campos.' }
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem.' }
  }

  if (password.length < 6) {
    return { error: 'A senha deve ter no mínimo 6 caracteres.' }
  }

  const supabase = await createClient()
  
  // Atualiza o usuário na sessão atual (que foi ativada pelo auth/callback)
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'Ocorreu um erro ao atualizar a senha. Seu link pode ter expirado.' }
  }

  // Redireciona de volta para o dashboard logado
  redirect('/dashboard')
}