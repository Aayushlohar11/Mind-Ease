/**
 * Recommended Content Component
 * Displays personalized content recommendations
 */

'use client'

import { useState, useEffect } from 'react'
import type { Recommendation } from '@backend/types/recommendation'
import { ContentCard } from './ContentCard'
import { Button } from '@frontend/components/ui/button'
import { Card } from '@frontend/components/ui/card'

interface RecommendedContentProps {
  userId: string
  currentMood?: string
  limit?: number
  onInteraction?: (contentId: string, type: string) => void
}

export function RecommendedContent({
  userId,
  currentMood,
  limit = 5,
  onInteraction,
}: RecommendedContentProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecommendations()
  }, [userId, currentMood])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          currentMood,
          limit,
          excludeViewed: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to load recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleInteraction = async (contentId: string, type: string) => {
    try {
      await fetch('/api/recommendations/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          contentId,
          interactionType: type,
        }),
      })

      if (onInteraction) {
        onInteraction(contentId, type)
      }

      // Reload recommendations after interaction
      if (type === 'complete') {
        loadRecommendations()
      }
    } catch (err) {
      console.error('Failed to record interaction:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recommended for You</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recommended for You</h2>
        <Card className="p-6">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={loadRecommendations} className="mt-4">
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recommended for You</h2>
        <Card className="p-6">
          <p className="text-gray-600">
            No recommendations available at the moment. Check back later!
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Recommended for You</h2>
        <Button variant="outline" onClick={loadRecommendations}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((recommendation) => (
          <ContentCard
            key={recommendation.id}
            content={recommendation.content}
            reason={recommendation.reason}
            score={recommendation.score}
            onView={() => handleInteraction(recommendation.content.id, 'view')}
            onStart={() => handleInteraction(recommendation.content.id, 'start')}
            onComplete={() => handleInteraction(recommendation.content.id, 'complete')}
            onBookmark={() => handleInteraction(recommendation.content.id, 'bookmark')}
          />
        ))}
      </div>
    </div>
  )
}
