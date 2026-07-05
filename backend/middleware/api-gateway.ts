/**
 * API Gateway Middleware
 * Centralized request handling, validation, and routing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export interface APIGatewayConfig {
  requireAuth?: boolean
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
  validateBody?: boolean
  cors?: boolean
}

/**
 * API Gateway middleware factory
 */
export function createAPIGateway(config: APIGatewayConfig = {}) {
  return async function apiGateway(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // CORS handling
      if (config.cors) {
        const origin = request.headers.get('origin')
        const allowedOrigins = [
          process.env.NEXTAUTH_URL || 'http://localhost:3000',
          'http://localhost:3000',
        ]

        if (origin && !allowedOrigins.includes(origin)) {
          return NextResponse.json({ error: 'CORS not allowed' }, { status: 403 })
        }
      }

      // Authentication check
      if (config.requireAuth) {
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        })

        if (!token) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Attach user info to request
        ;(request as any).user = token
      }

      // Rate limiting check
      if (config.rateLimit) {
        const rateLimitResult = await checkRateLimit(request, config.rateLimit)
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            {
              error: 'Too many requests',
              retryAfter: rateLimitResult.retryAfter,
            },
            {
              status: 429,
              headers: {
                'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
              },
            }
          )
        }
      }

      // Body validation
      if (config.validateBody && request.method !== 'GET') {
        const contentType = request.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
          return NextResponse.json(
            { error: 'Content-Type must be application/json' },
            { status: 400 }
          )
        }
      }

      // Execute handler
      const response = await handler(request)

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

      // Add CORS headers if enabled
      if (config.cors) {
        response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
      }

      return response
    } catch (error) {
      console.error('API Gateway error:', error)
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Rate limiting storage (in-memory)
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Check rate limit for request
 */
async function checkRateLimit(
  request: NextRequest,
  config: { maxRequests: number; windowMs: number }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const identifier = getClientIdentifier(request)
  const now = Date.now()

  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetAt) {
    // Create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return { allowed: true }
  }

  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  // Increment count
  record.count++
  return { allowed: true }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from token
  const userId = (request as any).user?.sub || (request as any).user?.id

  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

  return `ip:${ip}`
}

/**
 * Clean up expired rate limit records
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute
