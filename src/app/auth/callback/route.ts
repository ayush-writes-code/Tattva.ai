import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        // In development, redirect directly
        return NextResponse.redirect(new URL(next, request.url))
      } else if (forwardedHost) {
        // When behind a proxy (e.g. Vercel), use the forwarded host
        return NextResponse.redirect(new URL(next, `https://${forwardedHost}`))
      } else {
        return NextResponse.redirect(new URL(next, request.url))
      }
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(
    new URL('/login?message=Could not authenticate&type=error', request.url)
  )
}
