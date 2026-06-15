'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function setNickname(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }
  
  const nickname = formData.get('nickname') as string
  if (!nickname || nickname.trim().length < 2) {
    return { error: 'Nickname must be at least 2 characters.' }
  }

  // Update Auth Metadata
  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      nickname: nickname.trim(),
    }
  })
  
  if (metaError) {
    return { error: metaError.message }
  }
  
  // Update public.profiles table
  const { error: profileError } = await supabase.from('profiles').update({
    nickname: nickname.trim(),
  }).eq('id', user.id)
  
  if (profileError) {
    console.error('Failed to update nickname in profile table', profileError)
    // We don't fail hard if profile update fails because it might just be the column missing locally
  }
  
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
