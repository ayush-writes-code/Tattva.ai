import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Check if they already have a nickname in either metadata or profiles
  const metaNickname = user.user_metadata?.nickname
  if (metaNickname) {
    redirect('/dashboard')
  }

  const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single()
  if (profile?.nickname) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] opacity-[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--muted)] opacity-[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-[var(--bg)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-syne text-primary mb-2">Welcome to Tattva!</h1>
          <p className="text-muted text-sm">
            You're successfully authenticated. Before we begin, what should we call you?
          </p>
        </div>

        <OnboardingForm />
      </div>
    </div>
  )
}
