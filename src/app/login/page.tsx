'use client'

import { Suspense, useState, useTransition } from 'react'
import { signInWithProvider } from './actions'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1569 2.4189z"/>
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const messageType = searchParams.get('type') || 'error'

  const [isPending, startTransition] = useTransition()
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const handleOAuth = (provider: 'google' | 'github' | 'discord') => {
    setOauthLoading(provider)
    startTransition(async () => {
      await signInWithProvider(provider)
    })
  }

  const messageBgColor = messageType === 'success'
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    : messageType === 'warning'
    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    : 'bg-red-500/10 border-red-500/20 text-red-400'

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] opacity-[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--muted)] opacity-[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 gap-0 relative z-10">
        
        {/* Left Panel — Branding */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-surface border border-border rounded-l-2xl relative overflow-hidden">
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--bg)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <span className="text-2xl font-bold font-syne text-primary">Tattva.ai</span>
            </div>
            
            <h2 className="text-3xl font-bold font-syne text-primary leading-tight mb-4">
              Detect Deepfakes<br />with Precision
            </h2>
            <p className="text-muted text-base leading-relaxed mb-8">
              Multi-modal AI-powered detection system that analyzes images, video, and audio for synthetic manipulation.
            </p>

            <div className="space-y-4">
              {[
                { label: 'Multi-modal Analysis', desc: 'Image, video & audio detection' },
                { label: 'Neural Network Ensemble', desc: '6+ detection models working together' },
                { label: 'Forensic Reports', desc: 'Detailed PDF analysis reports' },
              ].map((feature) => (
                <div key={feature.label} className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 rounded-full border border-[var(--primary)] flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-primary text-sm font-medium">{feature.label}</p>
                    <p className="text-muted text-xs">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Free credits badge */}
            <div className="mt-10 inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--bg)] border border-border rounded-xl">
              <span className="text-lg">🎁</span>
              <div>
                <p className="text-primary text-sm font-semibold">10 Free Scans</p>
                <p className="text-muted text-xs">No credit card required</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Auth Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12 bg-surface border border-border rounded-2xl lg:rounded-l-none lg:rounded-r-2xl">
          
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--bg)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="text-xl font-bold font-syne text-primary">Tattva.ai</span>
          </div>

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold font-syne text-primary">
              Welcome to Tattva
            </h1>
            <p className="text-muted text-sm mt-2">
              Log in or create an account instantly to get 10 free scans.
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mb-8 p-3.5 rounded-xl border text-sm ${messageBgColor} animate-in fade-in slide-in-from-top-2 duration-300`}>
              {message}
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="flex flex-col gap-4">
            {[
              { provider: 'google' as const, icon: <GoogleIcon />, label: 'Continue with Google' },
              { provider: 'github' as const, icon: <GitHubIcon />, label: 'Continue with GitHub' },
              { provider: 'discord' as const, icon: <DiscordIcon />, label: 'Continue with Discord' },
            ].map(({ provider, icon, label }) => (
              <button
                key={provider}
                onClick={() => handleOAuth(provider)}
                disabled={isPending || !!oauthLoading}
                className="flex items-center justify-center gap-3 py-3.5 px-4 border border-border rounded-xl hover:bg-[var(--bg)] hover:border-primary/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group w-full"
              >
                {oauthLoading === provider ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <span className="group-hover:scale-110 transition-transform duration-200">
                      {icon}
                    </span>
                    <span className="text-sm font-medium text-primary">{label}</span>
                  </>
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-muted mt-8">
            By continuing, you agree to our{' '}
            <Link href="#" className="text-primary hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
          </p>

          {/* Mobile free credits badge */}
          <div className="lg:hidden mt-8 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg)] border border-border rounded-xl">
            <span className="text-lg">🎁</span>
            <p className="text-primary text-sm font-medium">10 free scans included</p>
          </div>
        </div>
      </div>
    </div>
  )
}
