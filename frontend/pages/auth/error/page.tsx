'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@frontend/components/ui/button'
import { PortfolioBackground } from '@frontend/components/portfolio/PortfolioBackground'

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification link is no longer valid.',
  CredentialsSignin: 'Invalid email or password. Please try again.',
  Default: 'An error occurred during authentication. Please try again.',
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Default'
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default

  return (
    <PortfolioBackground>
      <div className="min-h-screen flex items-center justify-center p-4 pt-24">
        <div className="card-portfolio w-full max-w-md p-8 space-y-6 text-center">
          <p className="font-mono text-sm text-teal-400">Auth error</p>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">{message}</p>
          <Button asChild className="w-full bg-teal-500 hover:bg-teal-400 text-background">
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </PortfolioBackground>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="font-mono text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  )
}
