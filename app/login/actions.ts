'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Função auxiliar para traduzir erros do Supabase
function translateAuthError(errorMessage: string) {
  if (errorMessage.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.'
  }
  if (errorMessage.includes('User already registered') || errorMessage.includes('already exists')) {
    return 'Já existe um usuário cadastrado com este e-mail.'
  }
  if (errorMessage.includes('Password should be at least 6 characters')) {
    return 'A senha deve ter pelo menos 6 caracteres.'
  }
  if (errorMessage.includes('Email not confirmed')) {
    return 'Por favor, confirme seu e-mail antes de entrar.'
  }
  if (errorMessage.includes('User not found')) {
    return 'Não existe usuário com essa conta.'
  }
  if (errorMessage.includes('rate_limit')) {
    return 'Muitas tentativas. Aguarde um momento e tente novamente.'
  }
  return `Ocorreu um erro: ${errorMessage}`
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Preencha todos os campos (e-mail e senha).' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: translateAuthError(error.message) }
  }
  
  redirect('/dashboard')
}

export async function signupAction(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!fullName || !email || !password || !confirmPassword) {
    return { error: 'Preencha todos os campos.' }
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      // Aponta para o callback após a confirmação do e-mail
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    }
  })

  if (error) {
    return { error: translateAuthError(error.message) }
  }
  
  redirect('/dashboard')
}

export async function resetPasswordAction(email: string) {
  if (!email) {
    return { error: 'Digite seu e-mail no campo acima para recuperar a senha.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Redireciona o fluxo para o callback trocar o código e enviar o usuário para a página de redefinir senha
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/login/reset-password`,
  })

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  return { success: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.' }
}