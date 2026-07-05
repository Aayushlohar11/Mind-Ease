'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@frontend/components/ui/button'
import { Input } from '@frontend/components/ui/input'
import { AuthLayout } from '@frontend/components/portfolio/AuthLayout'

function formatAuthError(error: string): string {
  if (error === 'CredentialsSignin') {
    return 'Invalid email or password. Please try again.'
  }
  return error
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setSuccess('Account created. Sign in with your credentials.')
    }
    const urlError = searchParams.get('error')
    if (urlError) setError(formatAuthError(urlError))
  }, [searchParams])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      })

      if (!result) {
        setError('Failed to sign in. Please try again.')
      } else if (result.error) {
        setError(formatAuthError(result.error))
      } else if (result.ok) {
        router.push(callbackUrl)
        router.refresh()
      } else {
        setError('Failed to sign in. Check your credentials.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to access your workspace">
      {success && (
        <div className="p-3 text-sm text-teal-400 bg-teal-500/10 border border-teal-500/30 rounded-lg mb-4">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isLoading}
            className="bg-background/50 border-white/10 focus:border-teal-500/50"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={isLoading}
            className="bg-background/50 border-white/10 focus:border-teal-500/50"
          />
        </div>
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg">
            {error}
          </div>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-teal-500 hover:bg-teal-400 text-background h-11"
        >
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        No account?{' '}
        <Link href="/auth/signup" className="text-teal-400 hover:underline font-medium">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="font-mono text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
