/**
 * User Data Export API Route
 * Allows users to export their data (GDPR compliance)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@backend/lib/auth'
import { getUserById } from '@backend/services/user.service'
import { getMoodEntries } from '@backend/services/mood.service'
import { getUserContentHistory } from '@backend/services/recommendation.service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth(request)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Gather all user data
    const user = await getUserById(userId)
    const moodEntries = await getMoodEntries(userId, {
      start: new Date(0), // All time
      end: new Date(),
    })
    const contentHistory = await getUserContentHistory(userId)

    // Create export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        createdAt: user?.createdAt,
        preferences: user?.preferences,
      },
      moodEntries: moodEntries.map((entry) => ({
        mood: entry.mood,
        intensity: entry.intensity,
        note: entry.note,
        triggers: entry.triggers,
        activities: entry.activities,
        timestamp: entry.timestamp,
      })),
      contentInteractions: contentHistory.interactions.map((interaction) => ({
        contentId: interaction.contentId,
        interactionType: interaction.interactionType,
        timestamp: interaction.timestamp,
        completed: interaction.completed,
      })),
      statistics: {
        totalMoodEntries: moodEntries.length,
        totalContentInteractions: contentHistory.interactions.length,
        bookmarkedContent: contentHistory.bookmarked.length,
        completedContent: contentHistory.completed.length,
      },
    }

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      {
        error: 'Failed to export data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
