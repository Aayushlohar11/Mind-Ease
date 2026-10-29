/**
 * Content Interaction API Route
 * Records user interactions with content
 */

import { NextRequest, NextResponse } from 'next/server'
import { recordInteraction } from '@backend/services/recommendation.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    if (!body.contentId || !body.interactionType) {
      return NextResponse.json(
        { error: 'Content ID and interaction type are required' },
        { status: 400 }
      )
    }

    const userId = body.userId || 'anonymous'

    // Record interaction
    const interaction = await recordInteraction(
      userId,
      body.contentId,
      body.interactionType,
      body.metadata
    )

    return NextResponse.json({ success: true, interaction })
  } catch (error) {
    console.error('Error recording interaction:', error)
    return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 })
  }
}
