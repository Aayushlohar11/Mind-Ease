/**
 * Signup API route
 */

import { NextRequest, NextResponse } from 'next/server'
import { signup, AuthError } from '@backend/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    console.log('Signup request received')
    const body = await request.json()
    console.log('Request body:', { email: body.email, name: body.name })
    const { email, password, name } = body

    const authResponse = await signup({ email, password, name })
    console.log('Signup successful:', authResponse.user.email)

    return NextResponse.json(
      {
        success: true,
        data: authResponse,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
