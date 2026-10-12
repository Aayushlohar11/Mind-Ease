'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@frontend/components/ui/button'
import { Input } from '@frontend/components/ui/input'
import { AuthLayout } from '@frontend/components/portfolio/AuthLayout'
import OTPInput from '@/frontend/components/OTPInput'

type Step = 'details' | 'otp'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOTP] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [expiresIn, setExpiresIn] = useState<number>(10)
  const [countdown, setCountdown] = useState<number>(0)
  const [devOtp, setDevOtp] = useState<string | null>(null)

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Send OTP
  const handleSendOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), purpose: 'signup' }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP')
        setIsLoading(false)
        return
      }

      setSuccess(data.message)
      if (data.devOtp) {
        setDevOtp(data.devOtp)
      } else {
        setDevOtp(null)
      }
      setStep('otp')
      setExpiresIn(data.expiresIn || 10)
      setCountdown(60) // 60 seconds before allowing resend
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP and Create Account
  const handleVerifyOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: otp,
          purpose: 'signup',
          name: name.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid OTP')
        setOTP('') // Clear OTP on error
        setIsLoading(false)
        return
      }

      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      // Establish NextAuth session so middleware and dashboard recognize login
      const { signIn } = await import('next-auth/react')
      await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        otpToken: data.token || 'verified',
        callbackUrl: '/dashboard',
      })

      // Full navigation to ensure session cookie is read
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return

    setError('')
    setSuccess('')
    setOTP('')

    const fakeEvent = {
      preventDefault: () => {},
    } as FormEvent<HTMLFormElement>

    await handleSendOTP(fakeEvent)
  }

  // Go back to details step
  const handleBackToDetails = () => {
    setStep('details')
    setOTP('')
    setError('')
    setSuccess('')
    setCountdown(0)
  }

  const inputClass = 'bg-background/50 border-white/10 focus:border-teal-500/50 h-11'

  // Details Step
  if (step === 'details') {
    return (
      <AuthLayout
        title="Create account"
        subtitle="Join Mind Ease - your AI mental health companion"
      >
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
              Full name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
              disabled={isLoading}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
              Email address
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
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground">
              We'll send a verification code to this email
            </p>
          </div>
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg">
              {error}
            </div>
          )}
          <Button
            type="submit"
            disabled={isLoading || !name || !email}
            className="w-full bg-teal-500 hover:bg-teal-400 text-background h-11"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending code...
              </span>
            ) : (
              'Continue with email'
            )}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-teal-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </AuthLayout>
    )
  }

  // OTP Step
  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        <span>
          We sent a verification code to
          <br />
          <span className="text-teal-400 font-medium">{email}</span>
        </span>
      }
    >
      {devOtp && (
        <div className="p-3.5 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl mb-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-200 flex items-center gap-1.5">
              <span>⚡</span> Demo / Testing Mode
            </span>
            <button
              type="button"
              onClick={() => setOTP(devOtp)}
              className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded font-mono border border-amber-500/40 transition-colors"
            >
              Auto-fill code
            </button>
          </div>
          <p className="text-amber-300/80 leading-relaxed">
            Email service not configured. Your verification code is <strong className="font-mono text-white text-sm tracking-wider px-1 bg-white/10 rounded">{devOtp}</strong> (or enter <strong>123456</strong>).
          </p>
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-teal-400 bg-teal-500/10 border border-teal-500/30 rounded-lg mb-6">
          {success}
        </div>
      )}
      <form onSubmit={handleVerifyOTP} className="space-y-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-muted-foreground text-center">
            Enter 6-digit code
          </label>
          <OTPInput value={otp} onChange={setOTP} disabled={isLoading} error={!!error} />
          <p className="text-xs text-center text-muted-foreground">
            Code expires in {expiresIn} minutes
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-teal-500 hover:bg-teal-400 text-background h-11"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating account...
              </span>
            ) : (
              'Verify & Create account'
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleBackToDetails}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              ← Change details
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading || countdown > 0}
              className="text-teal-400 hover:text-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
