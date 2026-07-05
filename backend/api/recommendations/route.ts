/**
 * Recommendations API Route
 * Handles content recommendation requests
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateRecommendations,
  getContent,
  getUserContentHistory,
} from '@backend/services/recommendation.service'
import type { ContentFilter } from '@backend/types/recommendation'
import type { RecommendationRequest } from '@backend/types/recommendation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const mode = searchParams.get('mode') || 'library'

    if (mode === 'history') {
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      }

      const history = await getUserContentHistory(userId)
      return NextResponse.json({ success: true, history })
    }

    const filter: ContentFilter = {
      search: searchParams.get('search') || undefined,
      maxDuration: searchParams.get('maxDuration')
        ? Number(searchParams.get('maxDuration'))
        : undefined,
      minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
      types: searchParams.get('types')
        ? (searchParams.get('types')!.split(',') as ContentFilter['types'])
        : undefined,
      categories: searchParams.get('categories')
        ? (searchParams.get('categories')!.split(',') as ContentFilter['categories'])
        : undefined,
      difficulty: searchParams.get('difficulty')
        ? (searchParams.get('difficulty')!.split(',') as ContentFilter['difficulty'])
        : undefined,
    }

    const contents = getContent(filter)

    return NextResponse.json({
      success: true,
      contents,
      totalCount: contents.length,
    })
  } catch (error) {
    console.error('Error loading resources:', error)
    return NextResponse.json({ error: 'Failed to load resources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json()

    // Validate request
    if (!body.userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Generate recommendations
    const recommendations = await generateRecommendations(body)

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}
