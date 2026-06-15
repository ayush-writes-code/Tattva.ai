'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?message=Please fill in all fields&type=error')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Provide more specific error messages
    if (error.message.includes('Invalid login credentials')) {
      redirect('/login?message=Invalid email or password&type=error')
    }
    if (error.message.includes('Email not confirmed')) {
      redirect('/login?message=Please verify your email before signing in&type=warning')
    }
    if (error.message.includes('Too many requests') || error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
      redirect('/login?message=Too many login attempts or rate limit exceeded. Please try again later.&type=error')
    }
    redirect(`/login?message=${encodeURIComponent(error.message)}&type=error`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const headerStore = await headers()
  const origin = headerStore.get('origin') || ''

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  if (!email || !password || !fullName) {
    redirect('/login?message=Please fill in all fields&type=error')
  }

  if (password.length < 6) {
    redirect('/login?message=Password must be at least 6 characters&type=error')
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      redirect('/login?message=An account with this email already exists&type=error')
    }
    if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
      redirect('/login?message=Email rate limit exceeded (Supabase limit is 3/hr). Please wait or use a different email.&type=error')
    }
    redirect(`/login?message=${encodeURIComponent(error.message)}&type=error`)
  }

  redirect('/auth/verify')
}

export async function signInWithProvider(provider: 'google' | 'github' | 'discord') {
  const supabase = await createClient()
  const headerStore = await headers()
  const origin = headerStore.get('origin') || ''

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}&type=error`)
  }

  if (data.url) {
    redirect(data.url)
  }

  redirect('/login?message=Something went wrong. Please try again.&type=error')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const headerStore = await headers()
  const origin = headerStore.get('origin') || ''

  const email = formData.get('email') as string

  if (!email) {
    redirect('/login?message=Please enter your email address&type=error&tab=reset')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}&type=error&tab=reset`)
  }

  redirect('/login?message=Check your email for a password reset link&type=success&tab=reset')
}
