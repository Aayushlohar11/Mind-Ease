/**
 * API Route: Verify OTP and Login/Signup
 * POST /api/auth/otp/verify
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP } from '@backend/services/otp.service'
import { findUserByEmail, createUser } from '@/services/user.service'
import { sign } from 'jsonwebtoken'

const JWT_SECRET = process.env.AUTH_TOKEN_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, purpose = 'login', name } = body

    // Validate input
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    // Verify OTP
    const verifyResult = await verifyOTP(email, code)

    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.message },
        { status: 400 }
      )
    }

    // Handle based on purpose
    if (purpose === 'signup') {
      // Check if user already exists
      const existingUser = await findUserByEmail(email)
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists. Please login instead.' },
          { status: 400 }
        )
      }

      // Create new user
      const newUser = await createUser({
        email,
        name: name || email.split('@')[0],
        password: '', // No password needed for OTP auth
        emailVerified: true, // Email is verified via OTP
      })

      // Generate JWT token
      const token = sign(
        { 
          userId: newUser.id, 
          email: newUser.email,
          name: newUser.name 
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      )

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          emailVerified: true,
        },
        token,
      })
    } else {
      // Login - find existing user
      const user = await findUserByEmail(email)

      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this email. Please sign up first.' },
          { status: 404 }
        )
      }

      // Generate JWT token
      const token = sign(
        { 
          userId: user.id, 
          email: user.email,
          name: user.name 
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      )

      return NextResponse.json({
        success: true,
        message: 'Logged in successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified || true,
        },
        token,
      })
    }
  } catch (error: any) {
    console.error('[API] Error verifying OTP:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
