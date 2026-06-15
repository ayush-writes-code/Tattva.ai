import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) redirect('/login')
  
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Settings
          </h1>
          <p className="mt-2 text-muted text-sm">
            Manage your account settings and profile.
          </p>
        </div>
        <SettingsForm user={user} />
      </div>
    </div>
  )
}
