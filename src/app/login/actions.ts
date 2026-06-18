'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function signInWithProvider(provider: 'google' | 'github' | 'discord' | 'x' | 'facebook') {
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
