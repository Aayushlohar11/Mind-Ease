/**
 * Content Recommendation Service
 * Implements content-based filtering and personalized recommendations
 * based on user mood history, preferences, and interactions
 */

import type {
  Content,
  ContentType,
  ContentCategory,
  Recommendation,
  RecommendationRequest,
  RecommendationResponse,
  RecommendationReasoning,
  ReasoningFactor,
  ContentInteraction,
  UserContentHistory,
  ContentFilter,
} from '@backend/types/recommendation'
import type { MoodEntry, MoodType, MoodCategory } from '@backend/types/mood'
import { getMoodEntries, getMoodHistory } from './mood.service'

/**
 * Sample content library
 * In production, this would come from a database
 */
const CONTENT_LIBRARY: Content[] = [
  {
    id: 'content-1',
    title: '5-Minute Breathing Exercise',
    description: 'A quick breathing exercise to help calm anxiety and reduce stress',
    type: 'exercise',
    category: 'breathing',
    tags: ['anxiety', 'stress', 'quick', 'beginner-friendly'],
    duration: 5,
    difficulty: 'beginner',
    targetMoods: ['anxious', 'stressed'],
    targetCategories: ['anxious', 'negative'],
    metadata: {
      language: 'en',
      rating: 4.7,
      reviewCount: 1250,
      completionRate: 0.85,
      effectivenessScore: 0.82,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'content-2',
    title: 'Guided Meditation for Better Sleep',
    description: 'A 15-minute guided meditation to help you relax and prepare for restful sleep',
    type: 'audio',
    category: 'meditation',
    tags: ['sleep', 'relaxation', 'evening', 'guided'],
    duration: 15,
    difficulty: 'beginner',
    targetMoods: ['tired', 'anxious'],
    targetCategories: ['negative', 'anxious'],
    metadata: {
      language: 'en',
      rating: 4.8,
      reviewCount: 2100,
      completionRate: 0.78,
      effectivenessScore: 0.88,
    },
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: 'content-3',
    title: 'Understanding Depression: A Guide',
    description: 'Educational article about depression, its symptoms, and coping strategies',
    type: 'article',
    category: 'education',
    tags: ['depression', 'education', 'mental-health', 'coping'],
    duration: 10,
    difficulty: 'beginner',
    targetMoods: ['sad', 'very_sad'],
    targetCategories: ['negative'],
    metadata: {
      language: 'en',
      rating: 4.6,
      reviewCount: 850,
      effectivenessScore: 0.75,
    },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'content-4',
    title: 'Gratitude Journaling Practice',
    description: 'Learn how to start a gratitude journal to improve your mood and outlook',
    type: 'exercise',
    category: 'journaling',
    tags: ['gratitude', 'positive', 'daily-practice', 'self-reflection'],
    duration: 10,
    difficulty: 'beginner',
    targetMoods: ['neutral', 'happy'],
    targetCategories: ['neutral', 'positive'],
    metadata: {
      language: 'en',
      rating: 4.9,
      reviewCount: 1800,
      completionRate: 0.92,
      effectivenessScore: 0.91,
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'content-5',
    title: 'Progressive Muscle Relaxation',
    description: 'A technique to release physical tension and reduce anxiety',
    type: 'exercise',
    category: 'mindfulness',
    tags: ['relaxation', 'anxiety', 'physical', 'tension-relief'],
    duration: 12,
    difficulty: 'intermediate',
    targetMoods: ['anxious', 'stressed'],
    targetCategories: ['anxious', 'negative'],
    metadata: {
      language: 'en',
      rating: 4.7,
      reviewCount: 950,
      completionRate: 0.81,
      effectivenessScore: 0.84,
    },
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'content-6',
    title: 'When to Seek Professional Help',
    description: "Understanding when it's time to reach out to a mental health professional",
    type: 'article',
    category: 'professional_help',
    tags: ['therapy', 'counseling', 'professional', 'support'],
    duration: 8,
    difficulty: 'beginner',
    targetMoods: ['sad', 'very_sad'],
    targetCategories: ['negative'],
    metadata: {
      language: 'en',
      rating: 4.8,
      reviewCount: 1100,
      effectivenessScore: 0.87,
    },
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: 'content-7',
    title: 'Mindful Walking Exercise',
    description: 'Combine physical activity with mindfulness for improved mood',
    type: 'activity',
    category: 'physical_activity',
    tags: ['walking', 'mindfulness', 'outdoor', 'movement'],
    duration: 20,
    difficulty: 'beginner',
    targetMoods: ['tired', 'neutral'],
    targetCategories: ['neutral', 'negative'],
    metadata: {
      language: 'en',
      rating: 4.6,
      reviewCount: 720,
      completionRate: 0.88,
      effectivenessScore: 0.79,
    },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'content-8',
    title: 'Building Social Connections',
    description: 'Strategies for maintaining and strengthening relationships',
    type: 'article',
    category: 'social_connection',
    tags: ['relationships', 'social', 'connection', 'loneliness'],
    duration: 12,
    difficulty: 'intermediate',
    targetMoods: ['sad', 'very_sad'],
    targetCategories: ['negative'],
    metadata: {
      language: 'en',
      rating: 4.5,
      reviewCount: 680,
      effectivenessScore: 0.76,
    },
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
]

/**
 * In-memory storage for user interactions
 * In production, this would be in a database
 */
const globalStore = globalThis as typeof globalThis & {
  __mindeaseContentInteractions?: Map<string, ContentInteraction[]>
}

const userInteractions =
  globalStore.__mindeaseContentInteractions ?? new Map<string, ContentInteraction[]>()

globalStore.__mindeaseContentInteractions = userInteractions

/**
 * Generate personalized content recommendations
 */
export async function generateRecommendations(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  const { userId, currentMood, preferences, limit = 5, excludeViewed = true } = request

  // Get user's mood history
  const moodHistory = await getMoodHistory(userId)

  // Get user's content interaction history
  const interactions = getUserInteractions(userId)

  // Filter content based on preferences
  let filteredContent = filterContent(CONTENT_LIBRARY, preferences)

  // Exclude already viewed content if requested
  if (excludeViewed) {
    const viewedIds = new Set(
      interactions.filter((i) => i.interactionType === 'view').map((i) => i.contentId)
    )
    filteredContent = filteredContent.filter((c) => !viewedIds.has(c.id))
  }

  // Score and rank content
  const scoredContent = filteredContent.map((content) => {
    const { score, reasoning } = scoreContent(content, {
      currentMood,
      moodHistory,
      interactions,
      preferences,
    })

    return {
      content,
      score,
      reasoning,
    }
  })

  // Sort by score and take top N
  const topContent = scoredContent.sort((a, b) => b.score - a.score).slice(0, limit)

  // Create recommendations
  const recommendations: Recommendation[] = topContent.map((item, index) => ({
    id: `rec_${Date.now()}_${index}`,
    userId,
    content: item.content,
    score: item.score,
    reason: generateReasonText(item.reasoning, currentMood),
    reasoning: item.reasoning,
    createdAt: new Date(),
    viewed: false,
    interacted: false,
  }))

  return {
    recommendations,
    totalCount: recommendations.length,
    generatedAt: new Date(),
    refreshIn: 3600, // 1 hour
  }
}

/**
 * Score content based on user context
 */
function scoreContent(
  content: Content,
  context: {
    currentMood?: MoodType
    moodHistory: any
    interactions: ContentInteraction[]
    preferences?: any
  }
): { score: number; reasoning: RecommendationReasoning } {
  const factors: ReasoningFactor[] = []
  let totalScore = 0

  // Factor 1: Mood matching (40% weight)
  if (context.currentMood) {
    const moodMatch = content.targetMoods.includes(context.currentMood) ? 1 : 0
    const categoryMatch = content.targetCategories.includes(
      context.moodHistory.summary?.dominantMood || 'neutral'
    )
      ? 0.5
      : 0
    const moodScore = (moodMatch + categoryMatch) * 0.4
    totalScore += moodScore

    factors.push({
      factor: 'mood_match',
      weight: 0.4,
      contribution: moodScore,
    })
  }

  // Factor 2: Content effectiveness (25% weight)
  const effectivenessScore = (content.metadata.effectivenessScore || 0.5) * 0.25
  totalScore += effectivenessScore

  factors.push({
    factor: 'effectiveness',
    weight: 0.25,
    contribution: effectivenessScore,
  })

  // Factor 3: User preferences (20% weight)
  if (context.preferences) {
    let prefScore = 0
    if (context.preferences.contentTypes?.includes(content.type)) {
      prefScore += 0.5
    }
    if (context.preferences.categories?.includes(content.category)) {
      prefScore += 0.5
    }
    prefScore *= 0.2
    totalScore += prefScore

    factors.push({
      factor: 'preferences',
      weight: 0.2,
      contribution: prefScore,
    })
  }

  // Factor 4: Popularity and rating (10% weight)
  const popularityScore = ((content.metadata.rating || 0) / 5) * 0.1
  totalScore += popularityScore

  factors.push({
    factor: 'popularity',
    weight: 0.1,
    contribution: popularityScore,
  })

  // Factor 5: Completion rate (5% weight)
  const completionScore = (content.metadata.completionRate || 0.5) * 0.05
  totalScore += completionScore

  factors.push({
    factor: 'completion_rate',
    weight: 0.05,
    contribution: completionScore,
  })

  // Calculate confidence based on available data
  const confidence = calculateConfidence(context, factors)

  return {
    score: totalScore,
    reasoning: {
      factors,
      basedOnMood: context.currentMood,
      basedOnPatterns: extractPatterns(context.moodHistory),
      confidence,
    },
  }
}

/**
 * Filter content based on preferences
 */
function filterContent(content: Content[], preferences?: any): Content[] {
  if (!preferences) {
    return content
  }

  return content.filter((item) => {
    // Filter by content types
    if (preferences.contentTypes && preferences.contentTypes.length > 0) {
      if (!preferences.contentTypes.includes(item.type)) {
        return false
      }
    }

    // Filter by categories
    if (preferences.categories && preferences.categories.length > 0) {
      if (!preferences.categories.includes(item.category)) {
        return false
      }
    }

    // Filter by max duration
    if (preferences.maxDuration && item.duration) {
      if (item.duration > preferences.maxDuration) {
        return false
      }
    }

    // Filter by difficulty
    if (preferences.difficulty && preferences.difficulty.length > 0) {
      if (!preferences.difficulty.includes(item.difficulty)) {
        return false
      }
    }

    return true
  })
}

/**
 * Generate human-readable reason text
 */
function generateReasonText(reasoning: RecommendationReasoning, currentMood?: MoodType): string {
  const reasons: string[] = []

  if (reasoning.basedOnMood) {
    reasons.push(`Recommended for your current mood: ${reasoning.basedOnMood}`)
  }

  const topFactor = reasoning.factors.sort((a, b) => b.contribution - a.contribution)[0]
  if (topFactor) {
    if (topFactor.factor === 'effectiveness') {
      reasons.push('Highly effective based on user feedback')
    } else if (topFactor.factor === 'popularity') {
      reasons.push('Popular among other users')
    }
  }

  if (reasoning.confidence > 0.8) {
    reasons.push('Strong match for your needs')
  }

  return reasons.join('. ') || 'Recommended for you'
}

/**
 * Extract patterns from mood history
 */
function extractPatterns(moodHistory: any): string[] {
  const patterns: string[] = []

  if (moodHistory.summary?.dominantMood) {
    patterns.push(`dominant_mood:${moodHistory.summary.dominantMood}`)
  }

  if (moodHistory.summary?.commonTriggers) {
    patterns.push(...moodHistory.summary.commonTriggers.map((t: string) => `trigger:${t}`))
  }

  return patterns
}

/**
 * Calculate confidence score
 */
function calculateConfidence(context: any, factors: ReasoningFactor[]): number {
  let confidence = 0.5 // Base confidence

  // Increase confidence if we have current mood
  if (context.currentMood) {
    confidence += 0.2
  }

  // Increase confidence if we have mood history
  if (context.moodHistory?.entries?.length > 5) {
    confidence += 0.15
  }

  // Increase confidence if we have interaction history
  if (context.interactions?.length > 3) {
    confidence += 0.15
  }

  return Math.min(confidence, 1.0)
}

/**
 * Get user's content interactions
 */
function getUserInteractions(userId: string): ContentInteraction[] {
  return userInteractions.get(userId) || []
}

/**
 * Record a content interaction
 */
export async function recordInteraction(
  userId: string,
  contentId: string,
  interactionType: 'view' | 'start' | 'complete' | 'bookmark' | 'share' | 'rate',
  metadata?: any
): Promise<ContentInteraction> {
  const interaction: ContentInteraction = {
    id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    contentId,
    interactionType,
    timestamp: new Date(),
    completed: interactionType === 'complete',
    metadata,
  }

  const interactions = userInteractions.get(userId) || []
  interactions.push(interaction)
  userInteractions.set(userId, interactions)

  return interaction
}

/**
 * Get content by ID
 */
export function getContentById(contentId: string): Content | null {
  return CONTENT_LIBRARY.find((c) => c.id === contentId) || null
}

/**
 * Get all content with optional filtering
 */
export function getContent(filter?: ContentFilter): Content[] {
  let content = [...CONTENT_LIBRARY]

  if (!filter) {
    return content
  }

  // Apply filters
  if (filter.types && filter.types.length > 0) {
    content = content.filter((c) => filter.types!.includes(c.type))
  }

  if (filter.categories && filter.categories.length > 0) {
    content = content.filter((c) => filter.categories!.includes(c.category))
  }

  if (filter.tags && filter.tags.length > 0) {
    content = content.filter((c) => filter.tags!.some((tag) => c.tags.includes(tag)))
  }

  if (filter.difficulty && filter.difficulty.length > 0) {
    content = content.filter((c) => filter.difficulty!.includes(c.difficulty))
  }

  if (filter.minRating) {
    content = content.filter((c) => (c.metadata.rating || 0) >= filter.minRating!)
  }

  if (filter.maxDuration) {
    content = content.filter((c) => !c.duration || c.duration <= filter.maxDuration!)
  }

  if (filter.search) {
    const searchLower = filter.search.toLowerCase()
    content = content.filter(
      (c) =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    )
  }

  return content
}

/**
 * Get user's content history
 */
export async function getUserContentHistory(userId: string): Promise<UserContentHistory> {
  const interactions = getUserInteractions(userId)

  const bookmarked = interactions
    .filter((i) => i.interactionType === 'bookmark')
    .map((i) => getContentById(i.contentId))
    .filter((c): c is Content => c !== null)

  const completed = interactions
    .filter((i) => i.interactionType === 'complete')
    .map((i) => getContentById(i.contentId))
    .filter((c): c is Content => c !== null)

  const inProgress = interactions
    .filter((i) => i.interactionType === 'start' && !i.completed)
    .map((i) => getContentById(i.contentId))
    .filter((c): c is Content => c !== null)

  return {
    userId,
    interactions,
    bookmarked,
    completed,
    inProgress,
    preferences: {
      contentTypes: [],
      categories: [],
    },
  }
}
