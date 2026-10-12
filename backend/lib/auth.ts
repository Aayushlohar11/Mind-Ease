/**
 * NextAuth v4 Configuration
 */

import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { login } from '@backend/services/auth.service'

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'default-secret-change-me'

export async function auth(request: NextRequest) {
  const token = await getToken({ req: request as any, secret: AUTH_SECRET })

  if (!token) {
    return null
  }

  return {
    user: {
      id: String((token as any).id || ''),
      email: String((token as any).email || ''),
      name: String((token as any).name || ''),
    },
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        otpToken: { label: 'OTP Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Email is required')
        }

        const email = credentials.email.trim().toLowerCase()

        // 1. OTP Token Login (used right after successful OTP verification)
        if (credentials.otpToken) {
          const { getUserByEmail, createUser } = await import('@backend/services/user.service')
          let user = await getUserByEmail(email)
          if (!user) {
            user = await createUser({
              email,
              name: email.split('@')[0],
              password: '',
            })
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        }

        // 2. Standard Password Login
        if (!credentials.password) {
          throw new Error('Password or verification token is required')
        }

        try {
          const authResponse = await login({
            email,
            password: credentials.password,
          })

          return {
            id: authResponse.user.id,
            email: authResponse.user.email,
            name: authResponse.user.name,
          }
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Invalid email or password'
          console.error('❌ NextAuth authorize error:', message)
          throw new Error(message)
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        console.log(`✅ JWT token created for user: ${user.email}`)
      }
      
      // Update token on session update
      if (trigger === 'update') {
        console.log(`🔄 JWT token updated`)
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: AUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
