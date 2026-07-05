/**
 * JWT token verification API route
 * (Moved from /api/auth/session to avoid conflicting with NextAuth's session endpoint)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@backend/services/auth.service'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'No authorization token provided',
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await verifySession(token)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
