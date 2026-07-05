/**
 * Content recommendation type definitions
 */

import { MoodType, MoodCategory } from './mood'

export type ContentType = 'article' | 'exercise' | 'video' | 'audio' | 'resource' | 'activity'

export type ContentCategory =
  | 'mindfulness'
  | 'breathing'
  | 'meditation'
  | 'journaling'
  | 'physical_activity'
  | 'social_connection'
  | 'professional_help'
  | 'self_care'
  | 'education'
  | 'coping_strategies'

export interface Content {
  id: string
  title: string
  description: string
  type: ContentType
  category: ContentCategory
  tags: string[]
  url?: string
  thumbnailUrl?: string
  duration?: number // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  targetMoods: MoodType[]
  targetCategories: MoodCategory[]
  metadata: ContentMetadata
  createdAt: Date
  updatedAt: Date
}

export interface ContentMetadata {
  author?: string
  source?: string
  language: string
  rating?: number
  reviewCount?: number
  completionRate?: number
  effectivenessScore?: number
}

export interface Recommendation {
  id: string
  userId: string
  content: Content
  score: number
  reason: string
  reasoning: RecommendationReasoning
  createdAt: Date
  expiresAt?: Date
  viewed: boolean
  interacted: boolean
  feedback?: RecommendationFeedback
}

export interface RecommendationReasoning {
  factors: ReasoningFactor[]
  basedOnMood?: MoodType
  basedOnPatterns?: string[]
  basedOnHistory?: string[]
  confidence: number
}

export interface ReasoningFactor {
  factor: string
  weight: number
  contribution: number
}

export interface RecommendationFeedback {
  helpful: boolean
  completed: boolean
  rating?: number
  comment?: string
  submittedAt: Date
}

export interface RecommendationRequest {
  userId: string
  currentMood?: MoodType
  preferences?: RecommendationPreferences
  limit?: number
  excludeViewed?: boolean
}

export interface RecommendationPreferences {
  contentTypes: ContentType[]
  categories: ContentCategory[]
  maxDuration?: number
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[]
  language?: string
}

export interface RecommendationResponse {
  recommendations: Recommendation[]
  totalCount: number
  generatedAt: Date
  refreshIn?: number // seconds until new recommendations available
}

export interface ContentInteraction {
  id: string
  userId: string
  contentId: string
  recommendationId?: string
  interactionType: InteractionType
  timestamp: Date
  duration?: number
  completed: boolean
  metadata?: any
}

export type InteractionType = 'view' | 'start' | 'complete' | 'bookmark' | 'share' | 'rate'

export interface ContentFilter {
  types?: ContentType[]
  categories?: ContentCategory[]
  tags?: string[]
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[]
  minRating?: number
  maxDuration?: number
  search?: string
}

export interface ContentLibrary {
  contents: Content[]
  totalCount: number
  filters: ContentFilter
  sortBy: 'relevance' | 'rating' | 'recent' | 'popular'
  page: number
  pageSize: number
}

export interface UserContentHistory {
  userId: string
  interactions: ContentInteraction[]
  bookmarked: Content[]
  completed: Content[]
  inProgress: Content[]
  preferences: RecommendationPreferences
}
