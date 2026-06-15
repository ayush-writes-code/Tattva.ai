'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Success — redirect to dashboard
      router.push('/dashboard')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-16 relative">
      {/* Subtle gradient glow behind the card */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[100px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 sm:p-10">
          {/* Lock Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-background border border-border">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="font-syne text-2xl sm:text-3xl font-bold text-primary mb-2 text-center">
            Reset Your Password
          </h1>

          <p className="text-muted text-sm text-center mb-8">
            Enter a new password for your account.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg bg-background border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-primary"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-sm text-primary placeholder:text-faint outline-none transition-all duration-200 focus:border-muted focus:ring-1 focus:ring-muted"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-primary"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-sm text-primary placeholder:text-faint outline-none transition-all duration-200 focus:border-muted focus:ring-1 focus:ring-muted"
              />
            </div>

            {/* Password Requirements */}
            <div className="rounded-lg bg-background border border-border px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">
                Password requirements
              </p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-xs text-muted">
                  <span
                    className={`inline-block h-1 w-1 rounded-full ${
                      password.length >= 6 ? 'bg-primary' : 'bg-faint'
                    } transition-colors`}
                  />
                  At least 6 characters
                </li>
                <li className="flex items-center gap-2 text-xs text-muted">
                  <span
                    className={`inline-block h-1 w-1 rounded-full ${
                      password === confirmPassword && confirmPassword.length > 0
                        ? 'bg-primary'
                        : 'bg-faint'
                    } transition-colors`}
                  />
                  Passwords match
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary text-background px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Updating…
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="border-t border-border mt-8 mb-6" />

          {/* Back to Login */}
          <div className="text-center">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-200 group-hover:-translate-x-1"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
