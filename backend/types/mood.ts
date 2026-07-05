/**
 * Mood tracking and entry type definitions
 */

export type MoodType =
  | 'very_happy'
  | 'happy'
  | 'neutral'
  | 'sad'
  | 'very_sad'
  | 'anxious'
  | 'stressed'
  | 'calm'
  | 'energetic'
  | 'tired'

export type MoodCategory = 'positive' | 'neutral' | 'negative' | 'anxious'

export interface MoodEntry {
  id: string
  userId: string
  mood: MoodType
  category: MoodCategory
  intensity: number // 1-10 scale
  timestamp: Date
  note?: string
  triggers?: string[]
  activities?: string[]
  context?: MoodContext
}

export interface MoodContext {
  location?: string
  weather?: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  socialContext?: 'alone' | 'with_friends' | 'with_family' | 'at_work'
  physicalState?: string[]
}

export interface MoodHistory {
  userId: string
  entries: MoodEntry[]
  dateRange: DateRange
  summary: MoodSummary
}

export interface DateRange {
  start: Date
  end: Date
}

export interface MoodSummary {
  totalEntries: number
  averageIntensity: number
  dominantMood: MoodType
  moodDistribution: MoodDistribution
  categoryDistribution: CategoryDistribution
  commonTriggers: string[]
  commonActivities: string[]
}

export type MoodDistribution = {
  [key in MoodType]?: number
}

export type CategoryDistribution = {
  [key in MoodCategory]: number
}

export interface MoodTrend {
  period: 'daily' | 'weekly' | 'monthly'
  direction: 'improving' | 'declining' | 'stable'
  changeRate: number // percentage change
  dataPoints: MoodDataPoint[]
}

export interface MoodDataPoint {
  date: Date
  averageIntensity: number
  mood: MoodType
  category: MoodCategory
  entryCount: number
}

export interface MoodPattern {
  type: 'time_of_day' | 'day_of_week' | 'trigger' | 'activity'
  pattern: string
  frequency: number
  correlation: number // -1 to 1
  impact: 'positive' | 'negative' | 'neutral'
}

export interface MoodEntryInput {
  mood: MoodType
  intensity: number
  note?: string
  triggers?: string[]
  activities?: string[]
  context?: Partial<MoodContext>
}
