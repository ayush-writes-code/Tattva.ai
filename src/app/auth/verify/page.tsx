import Link from 'next/link'

export default function VerifyEmailPage() {
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
        <div className="bg-surface border border-border rounded-2xl p-8 sm:p-10 text-center">
          {/* Mail Icon */}
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
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="font-syne text-2xl sm:text-3xl font-bold text-primary mb-3">
            Check Your Email
          </h1>

          {/* Subtitle */}
          <p className="text-muted text-sm leading-relaxed mb-8">
            We&apos;ve sent a verification link to your email address. Click
            the link to verify your account and get started.
          </p>

          {/* Divider */}
          <div className="border-t border-border mb-6" />

          {/* Tips */}
          <div className="text-left space-y-3 mb-8">
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
              Quick tips
            </p>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-background border border-border">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted"
                >
                  <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                  <path d="m2 17 10 5 10-5" />
                  <path d="m2 12 10 5 10-5" />
                </svg>
              </div>
              <p className="text-sm text-muted">
                Check your <span className="text-primary">spam or junk</span>{' '}
                folder if you don&apos;t see the email.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-background border border-border">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="text-sm text-muted">
                The verification link expires in{' '}
                <span className="text-primary">24 hours</span>.
              </p>
            </div>
          </div>

          {/* Back to Login */}
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
  )
}
