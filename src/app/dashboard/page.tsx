import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from './actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch profile — may not exist yet, so handle gracefully
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const credits = profile?.free_credits ?? 10
  const usedCredits = profile?.used_credits ?? 0
  const remaining = credits - usedCredits
  const progressPercent = credits > 0 ? (usedCredits / credits) * 100 : 0

  // SVG circular progress values
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  // User display info
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'User'
  const email = user.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-muted text-sm">
            Welcome back, {displayName}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Profile Card ── */}
          <div className="group rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-faint">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-16 w-16 rounded-full border-2 border-border object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background font-syne text-lg font-bold text-primary">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="truncate font-syne text-xl font-bold text-primary">
                  {displayName}
                </h2>
                <p className="mt-0.5 truncate text-sm text-muted">{email}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted">
                    <svg
                      className="mr-1.5 h-3 w-3 text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    Member since {memberSince}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Credits Card ── */}
          <div className="group rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-faint">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-syne text-sm font-semibold uppercase tracking-wider text-muted">
                Scan Credits
              </h3>
              <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted">
                10 Free Credits
              </span>
            </div>

            <div className="flex items-center gap-6">
              {/* Circular progress ring */}
              <div className="relative flex-shrink-0">
                <svg width="128" height="128" className="-rotate-90">
                  {/* Background ring */}
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="8"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-syne text-3xl font-bold text-primary">
                    {remaining}
                  </span>
                  <span className="text-xs text-muted">remaining</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Used</span>
                    <span className="font-medium text-primary">
                      {usedCredits} / {credits}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  Each scan uses 1 credit. Credits refresh on the free tier
                  monthly.
                </p>
              </div>
            </div>
          </div>

          {/* ── Upgrade CTA Card ── */}
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-faint">
            {/* Subtle gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent" />

            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="font-syne text-lg font-bold text-primary">
                  Need More Scans?
                </h3>
                <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Coming Soon
                </span>
              </div>
              <p className="mb-5 max-w-sm text-sm leading-relaxed text-muted">
                Unlock unlimited deepfake detection scans, priority processing,
                and advanced analytics with a premium plan.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  disabled
                  className="inline-flex cursor-not-allowed items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted opacity-60"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                    />
                  </svg>
                  Upgrade Plan
                </button>
                <button
                  disabled
                  className="inline-flex cursor-not-allowed items-center rounded-lg px-4 py-2 text-sm font-medium text-muted opacity-60"
                >
                  Compare Plans →
                </button>
              </div>
            </div>
          </div>

          {/* ── Recent Activity Card ── */}
          <div className="group rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-faint">
            <h3 className="mb-4 font-syne text-sm font-semibold uppercase tracking-wider text-muted">
              Recent Activity
            </h3>

            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background">
                <svg
                  className="h-6 w-6 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-primary">
                No scans yet
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted">
                Your deepfake detection scan history will appear here once you
                run your first analysis.
              </p>
            </div>
          </div>

          {/* ── Account Settings Card (full width) ── */}
          <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
            <h3 className="mb-5 font-syne text-sm font-semibold uppercase tracking-wider text-muted">
              Account
            </h3>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-primary">Signed in as</p>
                <p className="text-sm font-medium text-muted">{email}</p>
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-primary transition-all duration-200 hover:border-faint hover:bg-surface"
                >
                  <svg
                    className="mr-2 h-4 w-4 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
