'use client'

import { useState } from 'react'
import { updateProfile } from './actions'

export default function SettingsForm({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)
    
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="group rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-faint">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg">
            Profile updated successfully.
          </div>
        )}
        
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-primary">Nickname</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            defaultValue={user.user_metadata?.nickname || ''}
            className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-primary placeholder-muted focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
          />
        </div>
        
        <div>
          <label htmlFor="avatar_url" className="block text-sm font-medium text-primary">Avatar URL</label>
          <input
            type="url"
            id="avatar_url"
            name="avatar_url"
            defaultValue={user.user_metadata?.avatar_url || ''}
            placeholder="https://example.com/avatar.png"
            className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-primary placeholder-muted focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
          />
          <p className="mt-1.5 text-xs text-muted">Provide a direct link to an image (e.g. from Imgur or GitHub).</p>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
