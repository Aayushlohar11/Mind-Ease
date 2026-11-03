/**
 * Analytics API Route
 * Handles analytics data requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@backend/auth/auth'
import { generateAnalytics, generatePredictiveInsights } from '@backend/services/analytics.service'
import type { AnalyticsQuery } from '@shared/types/analytics'

export async function POST(request: NextRequest) {
  try {
    const session = await auth(request)
    const body: Partial<AnalyticsQuery> = await request.json().catch(() => ({}))

    const userId = body.userId || session?.user?.id

    // Validate request
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const query: AnalyticsQuery = {
      userId,
      period: body.period || 'week',
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      includeInsights: body.includeInsights ?? true,
      includePredictions: body.includePredictions ?? false,
    }

    // Generate analytics
    const analytics = await generateAnalytics(query)

    // Include predictive insights if requested
    if (query.includePredictions) {
      const predictions = await generatePredictiveInsights(userId)
      return NextResponse.json({ ...analytics, predictions })
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 })
  }
}
