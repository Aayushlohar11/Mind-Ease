/**
 * Chat API Route
 * Handles AI chat message processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isOpenAIConfigured } from '@backend/lib/env'
import {
  generateChatResponse,
  detectCrisisKeywords,
  getCrisisResponseMessage,
} from '@backend/services/ai-chat.service'
import { analyzeSentiment } from '@backend/services/sentiment.service'
import type { Message } from '@backend/types/message'
import { auth } from '@backend/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth(request)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, sessionId, conversationHistory = [] } = body

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message is required',
        },
        { status: 400 }
      )
    }

    // Check for crisis keywords
    const isCrisis = detectCrisisKeywords(message)
    if (isCrisis) {
      // Return crisis response immediately
      const crisisResponse = getCrisisResponseMessage()
      const sentiment = analyzeSentiment(message)

      return NextResponse.json({
        success: true,
        data: {
          response: crisisResponse,
          sentiment,
          isCrisis: true,
        },
      })
    }

    // Analyze sentiment
    const sentiment = analyzeSentiment(message)

    // Generate AI response
    const aiResponse = await generateChatResponse(message, conversationHistory)

    if (!aiResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: aiResponse.error?.message || 'Failed to generate response',
          code: aiResponse.error?.code,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        response: aiResponse.data,
        sentiment,
        metadata: aiResponse.metadata,
        usingFallback: !isOpenAIConfigured(),
      },
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
