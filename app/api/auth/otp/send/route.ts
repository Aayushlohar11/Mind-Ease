/**
 * API Route: Send OTP
 * POST /api/auth/otp/send
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateAndSendOTP } from '@backend/services/otp.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, purpose = 'login' } = body

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate purpose
    if (!['login', 'signup', 'verification'].includes(purpose)) {
      return NextResponse.json(
        { error: 'Invalid purpose' },
        { status: 400 }
      )
    }

    // Generate and send OTP
    const result = await generateAndSendOTP(email, purpose)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      expiresIn: result.expiresIn,
      devOtp: result.devOtp,
    })
  } catch (error: any) {
    console.error('[API] Error sending OTP:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
