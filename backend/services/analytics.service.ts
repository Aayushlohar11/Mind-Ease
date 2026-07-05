/**
 * Analytics Service
 * Provides mood analytics, insights, and predictive analysis
 */

import type {
  Analytics,
  AnalyticsQuery,
  MoodAnalytics,
  ChatAnalytics,
  EngagementAnalytics,
  Insight,
  InsightType,
  TriggerAnalysis,
  ActivityAnalysis,
  TimeDistribution,
  DayDistribution,
  Correlation,
  PredictiveInsight,
  TrendDirection,
} from '@backend/types/analytics'
import type { MoodEntry, MoodTrend, MoodPattern } from '@backend/types/mood'
import { getMoodEntries, getMoodTrends, detectMoodPatterns } from './mood.service'

/**
 * Generate comprehensive analytics for a user
 */
export async function generateAnalytics(query: AnalyticsQuery): Promise<Analytics> {
  const { userId, period, startDate, endDate, includeInsights = true } = query

  // Calculate date range
  const dateRange = calculateDateRange(period, startDate, endDate)

  // Get mood data
  const moodEntries = await getMoodEntries(userId, dateRange)

  // Generate analytics
  const moodAnalytics = await generateMoodAnalytics(userId, moodEntries, period)
  const chatAnalytics = await generateChatAnalytics(userId, dateRange)
  const engagementAnalytics = await generateEngagementAnalytics(userId, dateRange)

  // Generate insights
  const insights = includeInsights
    ? await generateInsights(userId, moodAnalytics, chatAnalytics, engagementAnalytics)
    : []

  return {
    userId,
    period,
    dateRange,
    moodAnalytics,
    chatAnalytics,
    engagementAnalytics,
    insights,
    generatedAt: new Date(),
  }
}

/**
 * Generate mood analytics
 */
async function generateMoodAnalytics(
  userId: string,
  entries: MoodEntry[],
  period: string
): Promise<MoodAnalytics> {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      averageMood: 0,
      moodTrends: [],
      patterns: [],
      topTriggers: [],
      topActivities: [],
      timeOfDayDistribution: { morning: 0, afternoon: 0, evening: 0, night: 0 },
      dayOfWeekDistribution: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      },
      correlations: [],
    }
  }

  // Calculate average mood intensity
  const averageMood =
    entries.reduce((sum, entry) => sum + entry.intensity, 0) / entries.length

  // Get mood trends
  const moodTrends = await getMoodTrends(userId, period as any)

  // Detect patterns
  const patterns = await detectMoodPatterns(userId)

  // Analyze triggers
  const topTriggers = analyzeTriggers(entries)

  // Analyze activities
  const topActivities = analyzeActivities(entries)

  // Time of day distribution
  const timeOfDayDistribution = analyzeTimeOfDay(entries)

  // Day of week distribution
  const dayOfWeekDistribution = analyzeDayOfWeek(entries)

  // Find correlations
  const correlations = findCorrelations(entries)

  return {
    totalEntries: entries.length,
    averageMood,
    moodTrends: [moodTrends],
    patterns,
    topTriggers,
    topActivities,
    timeOfDayDistribution,
    dayOfWeekDistribution,
    correlations,
  }
}

/**
 * Analyze triggers and their impact
 */
function analyzeTriggers(entries: MoodEntry[]): TriggerAnalysis[] {
  const triggerMap = new Map<
    string,
    { count: number; intensities: number[]; moods: Set<string> }
  >()

  entries.forEach((entry) => {
    entry.triggers?.forEach((trigger) => {
      if (!triggerMap.has(trigger)) {
        triggerMap.set(trigger, { count: 0, intensities: [], moods: new Set() })
      }
      const data = triggerMap.get(trigger)!
      data.count++
      data.intensities.push(entry.intensity)
      data.moods.add(entry.mood)
    })
  })

  const triggers: TriggerAnalysis[] = []
  triggerMap.forEach((data, trigger) => {
    const averageImpact = data.intensities.reduce((a, b) => a + b, 0) / data.intensities.length
    const trend = calculateTrend(data.intensities)

    triggers.push({
      trigger,
      frequency: data.count,
      averageImpact,
      associatedMoods: Array.from(data.moods) as any,
      trend,
    })
  })

  return triggers.sort((a, b) => b.frequency - a.frequency).slice(0, 10)
}

/**
 * Analyze activities and their effectiveness
 */
function analyzeActivities(entries: MoodEntry[]): ActivityAnalysis[] {
  const activityMap = new Map<
    string,
    { count: number; intensities: number[]; moods: Set<string> }
  >()

  entries.forEach((entry) => {
    entry.activities?.forEach((activity) => {
      if (!activityMap.has(activity)) {
        activityMap.set(activity, { count: 0, intensities: [], moods: new Set() })
      }
      const data = activityMap.get(activity)!
      data.count++
      data.intensities.push(entry.intensity)
      data.moods.add(entry.mood)
    })
  })

  const activities: ActivityAnalysis[] = []
  activityMap.forEach((data, activity) => {
    const averageImpact = data.intensities.reduce((a, b) => a + b, 0) / data.intensities.length
    const effectiveness = averageImpact / 10 // Normalize to 0-1

    activities.push({
      activity,
      frequency: data.count,
      averageImpact,
      associatedMoods: Array.from(data.moods) as any,
      effectiveness,
    })
  })

  return activities.sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 10)
}

/**
 * Analyze time of day distribution
 */
function analyzeTimeOfDay(entries: MoodEntry[]): TimeDistribution {
  const distribution = { morning: 0, afternoon: 0, evening: 0, night: 0 }

  entries.forEach((entry) => {
    const timeOfDay = entry.context?.timeOfDay
    if (timeOfDay && timeOfDay in distribution) {
      distribution[timeOfDay as keyof TimeDistribution]++
    }
  })

  return distribution
}

/**
 * Analyze day of week distribution
 */
function analyzeDayOfWeek(entries: MoodEntry[]): DayDistribution {
  const distribution = {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  entries.forEach((entry) => {
    const dayIndex = new Date(entry.timestamp).getDay()
    const dayName = dayNames[dayIndex] as keyof DayDistribution
    distribution[dayName]++
  })

  return distribution
}

/**
 * Find correlations between factors
 */
function findCorrelations(entries: MoodEntry[]): Correlation[] {
  const correlations: Correlation[] = []

  // Example: Correlation between time of day and mood intensity
  const timeIntensityCorr = calculateTimeIntensityCorrelation(entries)
  if (timeIntensityCorr.coefficient !== 0) {
    correlations.push(timeIntensityCorr)
  }

  return correlations
}

/**
 * Calculate correlation between time of day and mood intensity
 */
function calculateTimeIntensityCorrelation(entries: MoodEntry[]): Correlation {
  const timeValues: number[] = []
  const intensityValues: number[] = []

  entries.forEach((entry) => {
    const hour = new Date(entry.timestamp).getHours()
    timeValues.push(hour)
    intensityValues.push(entry.intensity)
  })

  const coefficient = calculatePearsonCorrelation(timeValues, intensityValues)

  return {
    factor1: 'time_of_day',
    factor2: 'mood_intensity',
    coefficient,
    significance: Math.abs(coefficient),
    description:
      coefficient > 0.3
        ? 'Mood tends to improve later in the day'
        : coefficient < -0.3
          ? 'Mood tends to decline later in the day'
          : 'No strong correlation between time and mood',
  }
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0
  }

  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) {
    return 0
  }

  return numerator / denominator
}

/**
 * Calculate trend direction from a series of values
 */
function calculateTrend(values: number[]): TrendDirection {
  if (values.length < 2) {
    return 'stable'
  }

  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

  const diff = secondAvg - firstAvg

  if (diff > 0.5) {
    return 'improving'
  } else if (diff < -0.5) {
    return 'declining'
  } else {
    return 'stable'
  }
}

/**
 * Generate chat analytics (placeholder - would integrate with chat service)
 */
async function generateChatAnalytics(
  userId: string,
  dateRange: { start: Date; end: Date }
): Promise<ChatAnalytics> {
  // This would integrate with the chat service to get actual data
  return {
    totalSessions: 0,
    totalMessages: 0,
    averageSessionLength: 0,
    averageSentiment: 0,
    sentimentTrend: [],
    topTopics: [],
    engagementScore: 0,
  }
}

/**
 * Generate engagement analytics (placeholder)
 */
async function generateEngagementAnalytics(
  userId: string,
  dateRange: { start: Date; end: Date }
): Promise<EngagementAnalytics> {
  return {
    loginFrequency: 0,
    averageSessionDuration: 0,
    featuresUsed: [],
    streakDays: 0,
    lastActiveAt: new Date(),
    engagementLevel: 'medium',
  }
}

/**
 * Generate insights from analytics data
 */
async function generateInsights(
  userId: string,
  moodAnalytics: MoodAnalytics,
  chatAnalytics: ChatAnalytics,
  engagementAnalytics: EngagementAnalytics
): Promise<Insight[]> {
  const insights: Insight[] = []

  // Mood trend insights
  if (moodAnalytics.moodTrends.length > 0) {
    const trend = moodAnalytics.moodTrends[0]
    if (trend.direction === 'improving') {
      insights.push({
        id: `insight_${Date.now()}_1`,
        type: 'mood_improvement',
        title: 'Your mood is improving!',
        description: `Your mood has improved by ${Math.abs(trend.changeRate).toFixed(1)}% over the recent period.`,
        severity: 'info',
        confidence: 0.85,
        dataPoints: trend.dataPoints,
        recommendations: [
          'Keep up the good work!',
          'Continue with activities that make you feel good',
        ],
        createdAt: new Date(),
      })
    } else if (trend.direction === 'declining') {
      insights.push({
        id: `insight_${Date.now()}_2`,
        type: 'mood_decline',
        title: 'Mood decline detected',
        description: `Your mood has declined by ${Math.abs(trend.changeRate).toFixed(1)}% recently.`,
        severity: 'warning',
        confidence: 0.8,
        dataPoints: trend.dataPoints,
        recommendations: [
          'Consider reaching out to a friend or loved one',
          'Try some relaxation exercises',
          'If this persists, consider speaking with a professional',
        ],
        createdAt: new Date(),
      })
    }
  }

  // Pattern insights
  if (moodAnalytics.patterns.length > 0) {
    const topPattern = moodAnalytics.patterns[0]
    insights.push({
      id: `insight_${Date.now()}_3`,
      type: 'pattern_detected',
      title: 'Pattern detected',
      description: topPattern.pattern,
      severity: 'info',
      confidence: topPattern.correlation,
      dataPoints: [],
      recommendations: ['Use this insight to plan your day better'],
      createdAt: new Date(),
    })
  }

  // Trigger insights
  if (moodAnalytics.topTriggers.length > 0) {
    const topTrigger = moodAnalytics.topTriggers[0]
    if (topTrigger.averageImpact < 5) {
      insights.push({
        id: `insight_${Date.now()}_4`,
        type: 'trigger_identified',
        title: 'Negative trigger identified',
        description: `"${topTrigger.trigger}" appears to negatively impact your mood`,
        severity: 'warning',
        confidence: 0.75,
        dataPoints: [],
        recommendations: [
          'Try to identify ways to avoid or manage this trigger',
          'Consider discussing this with a therapist',
        ],
        createdAt: new Date(),
      })
    }
  }

  // Activity insights
  if (moodAnalytics.topActivities.length > 0) {
    const topActivity = moodAnalytics.topActivities[0]
    if (topActivity.effectiveness > 0.7) {
      insights.push({
        id: `insight_${Date.now()}_5`,
        type: 'activity_effective',
        title: 'Effective activity found',
        description: `"${topActivity.activity}" seems to improve your mood significantly`,
        severity: 'info',
        confidence: 0.8,
        dataPoints: [],
        recommendations: ['Try to incorporate this activity more regularly'],
        createdAt: new Date(),
      })
    }
  }

  return insights
}

/**
 * Generate predictive insights
 */
export async function generatePredictiveInsights(userId: string): Promise<PredictiveInsight[]> {
  const insights: PredictiveInsight[] = []

  // Get recent mood data
  const recentEntries = await getMoodEntries(userId, {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date(),
  })

  if (recentEntries.length < 7) {
    return insights // Not enough data for predictions
  }

  // Simple trend-based prediction
  const recentIntensities = recentEntries.slice(-7).map((e) => e.intensity)
  const trend = calculateTrend(recentIntensities)

  if (trend === 'declining') {
    insights.push({
      id: `pred_${Date.now()}_1`,
      userId,
      prediction: 'Your mood may continue to decline if current patterns persist',
      probability: 0.65,
      timeframe: 'next 7 days',
      basedOn: ['Recent mood trend', 'Historical patterns'],
      preventativeActions: [
        'Increase engagement with positive activities',
        'Reach out to support network',
        'Consider professional support if needed',
      ],
      createdAt: new Date(),
    })
  }

  return insights
}

/**
 * Calculate date range based on period
 */
function calculateDateRange(
  period: string,
  startDate?: Date,
  endDate?: Date
): { start: Date; end: Date } {
  const end = endDate || new Date()
  let start: Date

  switch (period) {
    case 'day':
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
      break
    case 'week':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'quarter':
      start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  return { start, end }
}

/**
 * Export analytics data
 */
export async function exportAnalytics(
  userId: string,
  format: 'json' | 'csv' | 'pdf'
): Promise<any> {
  const analytics = await generateAnalytics({
    userId,
    period: 'month',
    includeInsights: true,
  })

  if (format === 'json') {
    return JSON.stringify(analytics, null, 2)
  }

  // CSV and PDF export would be implemented here
  throw new Error(`Export format ${format} not yet implemented`)
}
