/**
 * Content Filter Component
 * Allows users to filter and sort content recommendations
 */

'use client'

import { useState } from 'react'
import type { ContentType, ContentCategory } from '@backend/types/recommendation'
import { Button } from '@frontend/components/ui/button'
import { Card } from '@frontend/components/ui/card'

interface ContentFilterProps {
  onFilterChange: (filters: {
    types?: ContentType[]
    categories?: ContentCategory[]
    maxDuration?: number
    difficulty?: ('beginner' | 'intermediate' | 'advanced')[]
  }) => void
}

export function ContentFilter({ onFilterChange }: ContentFilterProps) {
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>([])
  const [selectedCategories, setSelectedCategories] = useState<ContentCategory[]>([])
  const [maxDuration, setMaxDuration] = useState<number | undefined>()
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    ('beginner' | 'intermediate' | 'advanced')[]
  >([])
  const [isExpanded, setIsExpanded] = useState(false)

  const contentTypes: ContentType[] = ['article', 'exercise', 'video', 'audio', 'activity']
  const categories: ContentCategory[] = [
    'mindfulness',
    'breathing',
    'meditation',
    'journaling',
    'physical_activity',
    'social_connection',
    'self_care',
    'education',
    'coping_strategies',
  ]
  const difficulties: ('beginner' | 'intermediate' | 'advanced')[] = [
    'beginner',
    'intermediate',
    'advanced',
  ]

  const handleTypeToggle = (type: ContentType) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type]
    setSelectedTypes(newTypes)
    applyFilters(newTypes, selectedCategories, maxDuration, selectedDifficulty)
  }

  const handleCategoryToggle = (category: ContentCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category]
    setSelectedCategories(newCategories)
    applyFilters(selectedTypes, newCategories, maxDuration, selectedDifficulty)
  }

  const handleDifficultyToggle = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    const newDifficulty = selectedDifficulty.includes(difficulty)
      ? selectedDifficulty.filter((d) => d !== difficulty)
      : [...selectedDifficulty, difficulty]
    setSelectedDifficulty(newDifficulty)
    applyFilters(selectedTypes, selectedCategories, maxDuration, newDifficulty)
  }

  const handleDurationChange = (duration: number | undefined) => {
    setMaxDuration(duration)
    applyFilters(selectedTypes, selectedCategories, duration, selectedDifficulty)
  }

  const applyFilters = (
    types: ContentType[],
    categories: ContentCategory[],
    duration: number | undefined,
    difficulty: ('beginner' | 'intermediate' | 'advanced')[]
  ) => {
    onFilterChange({
      types: types.length > 0 ? types : undefined,
      categories: categories.length > 0 ? categories : undefined,
      maxDuration: duration,
      difficulty: difficulty.length > 0 ? difficulty : undefined,
    })
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setSelectedCategories([])
    setMaxDuration(undefined)
    setSelectedDifficulty([])
    onFilterChange({})
  }

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedCategories.length > 0 ||
    maxDuration !== undefined ||
    selectedDifficulty.length > 0

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filters</h3>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Hide' : 'Show'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Content Types */}
          <div>
            <label className="text-sm font-medium mb-2 block">Content Type</label>
            <div className="flex flex-wrap gap-2">
              {contentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTypes.includes(type)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategories.includes(category)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-sm font-medium mb-2 block">Difficulty</label>
            <div className="flex gap-2">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => handleDifficultyToggle(difficulty)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedDifficulty.includes(difficulty)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          {/* Max Duration */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Max Duration: {maxDuration ? `${maxDuration} min` : 'Any'}
            </label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={maxDuration || 60}
              onChange={(e) => handleDurationChange(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 min</span>
              <span>60 min</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
