/**
 * Content Card Component
 * Displays individual content recommendation with actions
 */

'use client'

import { useState } from 'react'
import type { Content } from '@backend/types/recommendation'
import { Card } from '@frontend/components/ui/card'
import { Button } from '@frontend/components/ui/button'

interface ContentCardProps {
  content: Content
  reason?: string
  score?: number
  onView?: () => void
  onStart?: () => void
  onComplete?: () => void
  onBookmark?: () => void
}

export function ContentCard({
  content,
  reason,
  score,
  onView,
  onStart,
  onComplete,
  onBookmark,
}: ContentCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isStarted, setIsStarted] = useState(false)

  const handleView = () => {
    if (onView) {
      onView()
    }
  }

  const handleStart = () => {
    setIsStarted(true)
    if (onStart) {
      onStart()
    }
    handleView()
  }

  const handleComplete = () => {
    if (onComplete) {
      onComplete()
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    if (onBookmark) {
      onBookmark()
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return '📄'
      case 'exercise':
        return '🧘'
      case 'video':
        return '🎥'
      case 'audio':
        return '🎧'
      case 'activity':
        return '🏃'
      default:
        return '📚'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-100'
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100'
      case 'advanced':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getTypeIcon(content.type)}</span>
            <div>
              <h3 className="font-semibold text-lg leading-tight">{content.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(content.difficulty)}`}
                >
                  {content.difficulty}
                </span>
                {content.duration && (
                  <span className="text-xs text-gray-500">{content.duration} min</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleBookmark}
            className="text-xl hover:scale-110 transition-transform"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {isBookmarked ? '🔖' : '📌'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-2 flex-1">
        <p className="text-sm text-gray-600 line-clamp-3">{content.description}</p>

        {reason && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
            💡 {reason}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {content.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
              {tag}
            </span>
          ))}
        </div>

        {/* Rating */}
        {content.metadata.rating && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-yellow-500">⭐</span>
            <span className="text-sm font-medium">{content.metadata.rating.toFixed(1)}</span>
            {content.metadata.reviewCount && (
              <span className="text-xs text-gray-500">
                ({content.metadata.reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 pt-2 border-t flex gap-2">
        {!isStarted ? (
          <Button onClick={handleStart} className="flex-1">
            Start
          </Button>
        ) : (
          <>
            <Button onClick={handleView} variant="outline" className="flex-1">
              Continue
            </Button>
            <Button onClick={handleComplete} className="flex-1">
              Complete
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
