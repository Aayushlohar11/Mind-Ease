/**
 * Analytics API Route
 * Handles analytics data requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateAnalytics, generatePredictiveInsights } from '@backend/services/analytics.service'
import type { AnalyticsQuery } from '@backend/types/analytics'

export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsQuery = await request.json()

    // Validate request
    if (!body.userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Generate analytics
    const analytics = await generateAnalytics(body)

    // Include predictive insights if requested
    if (body.includePredictions) {
      const predictions = await generatePredictiveInsights(body.userId)
      return NextResponse.json({ ...analytics, predictions })
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 })
  }
}
