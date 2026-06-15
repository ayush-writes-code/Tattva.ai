'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }
  
  const nickname = formData.get('nickname') as string
  const avatarUrl = formData.get('avatar_url') as string
  
  // Update Auth Metadata
  const { error } = await supabase.auth.updateUser({
    data: {
      nickname: nickname,
      avatar_url: avatarUrl
    }
  })
  
  if (error) {
    return { error: error.message }
  }
  
  // Update public.profiles table
  const { error: profileError } = await supabase.from('profiles').update({
    nickname: nickname,
    avatar_url: avatarUrl
  }).eq('id', user.id)
  
  if (profileError) {
    console.error('Failed to update profile table', profileError)
  }
  
  revalidatePath('/', 'layout')
  
  return { success: true }
}
