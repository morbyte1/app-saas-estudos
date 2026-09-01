'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

function translateAuthError(errorMessage: string) {
  if (errorMessage.includes('Invalid login credentials')) return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.'
  if (errorMessage.includes('User already registered') || errorMessage.includes('already exists')) return 'Já existe um usuário cadastrado com este e-mail.'
  if (errorMessage.includes('Password should be at least 6 characters')) return 'A senha deve ter pelo menos 6 caracteres.'
  if (errorMessage.includes('Email not confirmed')) return 'Por favor, confirme seu e-mail antes de entrar.'
  if (errorMessage.includes('User not found')) return 'Não existe usuário com essa conta.'
  if (errorMessage.includes('rate_limit')) return 'Muitas tentativas. Aguarde um momento e tente novamente.'
  return `Ocorreu um erro: ${errorMessage}`
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Preencha todos os campos (e-mail e senha).' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: translateAuthError(error.message) }
  
  redirect('/dashboard')
}

export async function signupAction(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!fullName || !email || !password || !confirmPassword) return { error: 'Preencha todos os campos.' }
  if (password !== confirmPassword) return { error: 'As senhas não coincidem.' }

  const supabase = await createClient()

  // VERIFICAÇÃO DO LIMITE DE 30 USUÁRIOS
  const { data: userCount, error: countError } = await supabase.rpc('get_user_count')
  
  if (!countError && userCount !== null && userCount >= 0) {
    return { error: 'Vagas esgotadas', isWaitlist: true }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://revyza.com.br'}/auth/callback?next=/dashboard`,
    }
  })

  if (error) return { error: translateAuthError(error.message) }
  
  redirect('/dashboard')
}

export async function resetPasswordAction(email: string) {
  if (!email) return { error: 'Digite seu e-mail no campo acima para recuperar a senha.' }

  const supabase = await createClient()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://revyza.com.br').replace(/\/$/, '')
  const redirectUrl = `${siteUrl}/auth/callback?next=/login/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl })

  if (error) return { error: translateAuthError(error.message) }
  return { success: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.' }
}

export async function joinWaitlistAction(formData: FormData) {
  const name = formData.get('fullName') as string
  const email = formData.get('email') as string

  if (!name || !email) return { error: 'Preencha nome e e-mail.' }

  const supabase = await createClient()
  const { error } = await supabase.from('waitlist').insert([{ name, email }])

  if (error) {
    if (error.code === '23505') return { error: 'Este e-mail já está na nossa lista de espera!' }
    return { error: 'Erro ao entrar na lista. Tente novamente.' }
  }

  return { success: 'Você está na lista de espera! Avisaremos assim que novas vagas abrirem.' }
}