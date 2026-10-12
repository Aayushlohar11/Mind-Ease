/**
 * Mood API Routes
 * Handles mood entry creation and retrieval
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@backend/lib/auth'
import {
  createMoodEntry,
  deleteMoodEntry,
  detectMoodPatterns,
  getMoodHistory,
  getMoodTrends,
  updateMoodEntry,
} from '@backend/services/mood.service'
import type { MoodEntryInput } from '@backend/types/mood'

/**
 * GET /api/mood - Get mood history
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth(request)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)

    // Parse date range if provided
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateRange =
      startDate && endDate
        ? {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        : undefined

    const history = await getMoodHistory(userId, dateRange)

    if (searchParams.get('includeInsights') === 'true') {
      const trendPeriod = (searchParams.get('trendPeriod') || 'daily') as
        | 'daily'
        | 'weekly'
        | 'monthly'
      const [trend, patterns] = await Promise.all([
        getMoodTrends(userId, trendPeriod),
        detectMoodPatterns(userId),
      ])

      return NextResponse.json({
        success: true,
        data: history,
        insights: {
          trend,
          patterns,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error: any) {
    console.error('Get mood history error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve mood history',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/mood - Update a mood entry
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth(request)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body: Partial<MoodEntryInput> & { id?: string } = await request.json()

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mood entry id is required',
        },
        { status: 400 }
      )
    }

    if (body.intensity !== undefined && (body.intensity < 1 || body.intensity > 10)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Intensity must be between 1 and 10',
        },
        { status: 400 }
      )
    }

    const entry = await updateMoodEntry(userId, body.id, body)

    return NextResponse.json({
      success: true,
      data: entry,
    })
  } catch (error: any) {
    console.error('Update mood entry error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update mood entry',
      },
      { status: error.message === 'Mood entry not found' ? 404 : 500 }
    )
  }
}

/**
 * DELETE /api/mood?id=... - Delete a mood entry
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth(request)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('id')

    if (!entryId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mood entry id is required',
        },
        { status: 400 }
      )
    }

    await deleteMoodEntry(userId, entryId)

    return NextResponse.json({
      success: true,
      message: 'Mood entry deleted',
    })
  } catch (error: any) {
    console.error('Delete mood entry error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete mood entry',
      },
      { status: error.message === 'Mood entry not found' ? 404 : 500 }
    )
  }
}

/**
 * POST /api/mood - Create mood entry
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth(request)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body: MoodEntryInput = await request.json()

    // Validate input
    if (!body.mood || typeof body.intensity !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Mood and intensity are required',
        },
        { status: 400 }
      )
    }

    if (body.intensity < 1 || body.intensity > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Intensity must be between 1 and 10',
        },
        { status: 400 }
      )
    }

    const entry = await createMoodEntry(userId, body)

    return NextResponse.json(
      {
        success: true,
        data: entry,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create mood entry error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create mood entry',
      },
      { status: 500 }
    )
  }
}
