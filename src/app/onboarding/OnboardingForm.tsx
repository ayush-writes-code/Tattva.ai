'use client'

import { useState } from 'react'
import { setNickname } from './actions'

export default function OnboardingForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await setNickname(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-primary mb-2">
          Sweet Nickname
        </label>
        <input
          type="text"
          id="nickname"
          name="nickname"
          required
          minLength={2}
          placeholder="e.g. Maverick, Shadow, Nova"
          className="w-full rounded-xl border border-border bg-[var(--bg)] px-4 py-3 text-sm text-primary placeholder-[var(--faint)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-[var(--bg)] transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </span>
        ) : (
          'Continue to Dashboard'
        )}
      </button>
    </form>
  )
}
