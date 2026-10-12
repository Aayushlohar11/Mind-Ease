/**
 * Middleware for route protection and authentication
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/chat', '/mood', '/analytics']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/auth/login', '/auth/signup']

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'default-secret-change-me'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if session cookie exists
  const hasSessionCookie =
    request.cookies.has('__Secure-next-auth.session-token') ||
    request.cookies.has('next-auth.session-token')

  // Get the token from the request
  let token = null
  try {
    token = await getToken({
      req: request,
      secret: AUTH_SECRET,
      secureCookie: request.url.startsWith('https://'),
    })
  } catch (err) {
    console.error('Middleware getToken error:', err)
  }

  // User is authenticated if token was decoded or valid session cookie is present
  const isAuthenticated = !!token || hasSessionCookie

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
