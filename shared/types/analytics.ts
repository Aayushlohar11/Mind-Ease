/**
 * Analytics and insights type definitions
 */

import { MoodType, MoodCategory, MoodTrend, MoodPattern } from './mood'

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'

export type TrendDirection = 'improving' | 'declining' | 'stable'

export interface Analytics {
  userId: string
  period: AnalyticsPeriod
  dateRange: {
    start: Date
    end: Date
  }
  moodAnalytics: MoodAnalytics
  chatAnalytics: ChatAnalytics
  engagementAnalytics: EngagementAnalytics
  insights: Insight[]
  generatedAt: Date
}

export interface MoodAnalytics {
  totalEntries: number
  averageMood: number
  moodTrends: MoodTrend[]
  patterns: MoodPattern[]
  topTriggers: TriggerAnalysis[]
  topActivities: ActivityAnalysis[]
  timeOfDayDistribution: TimeDistribution
  dayOfWeekDistribution: DayDistribution
  correlations: Correlation[]
}

export interface ChatAnalytics {
  totalSessions: number
  totalMessages: number
  averageSessionLength: number
  averageSentiment: number
  sentimentTrend: SentimentTrendPoint[]
  topTopics: TopicAnalysis[]
  engagementScore: number
}

export interface EngagementAnalytics {
  loginFrequency: number
  averageSessionDuration: number
  featuresUsed: FeatureUsage[]
  streakDays: number
  lastActiveAt: Date
  engagementLevel: 'low' | 'medium' | 'high'
}

export interface TriggerAnalysis {
  trigger: string
  frequency: number
  averageImpact: number
  associatedMoods: MoodType[]
  trend: TrendDirection
}

export interface ActivityAnalysis {
  activity: string
  frequency: number
  averageImpact: number
  associatedMoods: MoodType[]
  effectiveness: number
}

export interface TimeDistribution {
  morning: number
  afternoon: number
  evening: number
  night: number
}

export interface DayDistribution {
  monday: number
  tuesday: number
  wednesday: number
  thursday: number
  friday: number
  saturday: number
  sunday: number
}

export interface Correlation {
  factor1: string
  factor2: string
  coefficient: number // -1 to 1
  significance: number // 0 to 1
  description: string
}

export interface SentimentTrendPoint {
  date: Date
  averageSentiment: number
  messageCount: number
}

export interface TopicAnalysis {
  topic: string
  frequency: number
  sentiment: number
  keywords: string[]
}

export interface FeatureUsage {
  feature: string
  usageCount: number
  lastUsedAt: Date
}

export interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  confidence: number
  dataPoints: any[]
  recommendations: string[]
  createdAt: Date
}

export type InsightType =
  | 'mood_improvement'
  | 'mood_decline'
  | 'pattern_detected'
  | 'trigger_identified'
  | 'activity_effective'
  | 'engagement_change'
  | 'risk_alert'

export interface PredictiveInsight {
  id: string
  userId: string
  prediction: string
  probability: number
  timeframe: string
  basedOn: string[]
  preventativeActions: string[]
  createdAt: Date
}

export interface AnalyticsQuery {
  userId: string
  period: AnalyticsPeriod
  startDate?: Date
  endDate?: Date
  includeInsights?: boolean
  includePredictions?: boolean
}

export interface AnalyticsExport {
  userId: string
  format: 'json' | 'csv' | 'pdf'
  data: Analytics
  exportedAt: Date
}
