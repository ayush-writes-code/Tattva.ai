import { type NextRequest, NextResponse } from 'next/server'

// Temporary fix - Supabase disabled
export async function proxy(request: NextRequest) {
  // Simply pass through the request without Supabase processing
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}