/**
 * Mood Tracking Service
 * Handles mood entry storage, retrieval, and trend analysis
 */

import * as moodRepository from '@backend/lib/repositories/mood.repository'
import { isDatabaseConfigured } from '@backend/lib/db'
import type {
  MoodEntry,
  MoodEntryInput,
  MoodHistory,
  MoodSummary,
  MoodTrend,
  MoodDataPoint,
  MoodPattern,
  MoodType,
  MoodCategory,
  DateRange,
} from '@backend/types/mood'
import { getMoodCategory } from './sentiment.service'

// In-memory mood storage when PostgreSQL is not configured.
// Keep it on globalThis so Next hot reloads do not wipe local development data.
const globalStore = globalThis as typeof globalThis & {
  __mindeaseMoodEntries?: Map<string, MoodEntry[]>
}

const memoryMoodEntries = globalStore.__mindeaseMoodEntries ?? new Map<string, MoodEntry[]>()

globalStore.__mindeaseMoodEntries = memoryMoodEntries

function getMemoryEntries(userId: string): MoodEntry[] {
  return memoryMoodEntries.get(userId) || []
}

/**
 * Create a new mood entry
 */
export async function createMoodEntry(userId: string, input: MoodEntryInput): Promise<MoodEntry> {
  const timeOfDay = getTimeOfDay()
  const category = getMoodCategory(input.mood)

  if (isDatabaseConfigured()) {
    return moodRepository.createMoodEntry(userId, input, category, timeOfDay)
  }

  const entry: MoodEntry = {
    id: `mood_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    mood: input.mood,
    category,
    intensity: input.intensity,
    timestamp: new Date(),
    note: input.note,
    triggers: input.triggers,
    activities: input.activities,
    context: {
      timeOfDay,
      ...input.context,
    },
  }

  const existing = getMemoryEntries(userId)
  existing.push(entry)
  memoryMoodEntries.set(userId, existing)
  return entry
}

/**
 * Update an existing mood entry owned by a user
 */
export async function updateMoodEntry(
  userId: string,
  entryId: string,
  input: Partial<MoodEntryInput>
): Promise<MoodEntry> {
  if (isDatabaseConfigured()) {
    const existing = await moodRepository.getMoodEntryById(entryId)
    if (!existing || existing.userId !== userId) {
      throw new Error('Mood entry not found')
    }

    const nextMood = input.mood || existing.mood
    return moodRepository.updateMoodEntry(entryId, input, getMoodCategory(nextMood))
  }

  const entries = getMemoryEntries(userId)
  const entryIndex = entries.findIndex((entry) => entry.id === entryId)

  if (entryIndex === -1) {
    throw new Error('Mood entry not found')
  }

  const existing = entries[entryIndex]
  const nextMood = input.mood || existing.mood
  const updated: MoodEntry = {
    ...existing,
    ...input,
    mood: nextMood,
    category: getMoodCategory(nextMood),
    context: {
      ...existing.context,
      ...input.context,
      timeOfDay: input.context?.timeOfDay || existing.context?.timeOfDay || getTimeOfDay(),
    },
  }

  entries[entryIndex] = updated
  memoryMoodEntries.set(userId, entries)
  return updated
}

/**
 * Delete an existing mood entry owned by a user
 */
export async function deleteMoodEntry(userId: string, entryId: string): Promise<void> {
  if (isDatabaseConfigured()) {
    const existing = await moodRepository.getMoodEntryById(entryId)
    if (!existing || existing.userId !== userId) {
      throw new Error('Mood entry not found')
    }

    await moodRepository.deleteMoodEntry(entryId)
    return
  }

  const entries = getMemoryEntries(userId)
  const nextEntries = entries.filter((entry) => entry.id !== entryId)

  if (nextEntries.length === entries.length) {
    throw new Error('Mood entry not found')
  }

  memoryMoodEntries.set(userId, nextEntries)
}

/**
 * Get mood entries for a user
 */
export async function getMoodEntries(userId: string, dateRange?: DateRange): Promise<MoodEntry[]> {
  if (isDatabaseConfigured()) {
    return moodRepository.getMoodEntries(userId, dateRange)
  }

  let entries = getMemoryEntries(userId)
  if (dateRange) {
    entries = entries.filter((e) => e.timestamp >= dateRange.start && e.timestamp <= dateRange.end)
  }
  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Get mood history with summary
 */
export async function getMoodHistory(userId: string, dateRange?: DateRange): Promise<MoodHistory> {
  const entries = await getMoodEntries(userId, dateRange)
  const summary = await calculateMoodSummary(entries)

  return {
    userId,
    entries,
    dateRange: dateRange || {
      start: entries[entries.length - 1]?.timestamp || new Date(),
      end: new Date(),
    },
    summary,
  }
}

/**
 * Calculate mood summary statistics
 */
async function calculateMoodSummary(entries: MoodEntry[]): Promise<MoodSummary> {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      averageIntensity: 0,
      dominantMood: 'neutral',
      moodDistribution: {},
      categoryDistribution: {
        positive: 0,
        neutral: 0,
        negative: 0,
        anxious: 0,
      },
      commonTriggers: [],
      commonActivities: [],
    }
  }

  // Calculate average intensity
  const totalIntensity = entries.reduce((sum, entry) => sum + entry.intensity, 0)
  const averageIntensity = totalIntensity / entries.length

  // Calculate mood distribution
  const moodDistribution: Record<MoodType, number> = {} as any
  entries.forEach((entry) => {
    moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1
  })

  // Find dominant mood
  const dominantMood = Object.entries(moodDistribution).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0] as MoodType

  // Calculate category distribution
  const categoryDistribution = {
    positive: 0,
    neutral: 0,
    negative: 0,
    anxious: 0,
  }
  entries.forEach((entry) => {
    categoryDistribution[entry.category]++
  })

  // Find common triggers
  const triggerCounts: Record<string, number> = {}
  entries.forEach((entry) => {
    entry.triggers?.forEach((trigger) => {
      triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1
    })
  })
  const commonTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([trigger]) => trigger)

  // Find common activities
  const activityCounts: Record<string, number> = {}
  entries.forEach((entry) => {
    entry.activities?.forEach((activity) => {
      activityCounts[activity] = (activityCounts[activity] || 0) + 1
    })
  })
  const commonActivities = Object.entries(activityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([activity]) => activity)

  return {
    totalEntries: entries.length,
    averageIntensity,
    dominantMood,
    moodDistribution,
    categoryDistribution,
    commonTriggers,
    commonActivities,
  }
}

/**
 * Calculate mood trends over time
 */
export async function getMoodTrends(
  userId: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<MoodTrend> {
  const entries = await getMoodEntries(userId)

  if (entries.length === 0) {
    return {
      period,
      direction: 'stable',
      changeRate: 0,
      dataPoints: [],
    }
  }

  // Group entries by period
  const dataPoints = groupEntriesByPeriod(entries, period)

  // Calculate trend direction
  const direction = calculateTrendDirection(dataPoints)

  // Calculate change rate
  const changeRate = calculateChangeRate(dataPoints)

  return {
    period,
    direction,
    changeRate,
    dataPoints,
  }
}

/**
 * Group entries by time period
 */
function groupEntriesByPeriod(
  entries: MoodEntry[],
  period: 'daily' | 'weekly' | 'monthly'
): MoodDataPoint[] {
  const groups: Map<string, MoodEntry[]> = new Map()

  entries.forEach((entry) => {
    const date = new Date(entry.timestamp)
    let key: string

    if (period === 'daily') {
      key = date.toISOString().split('T')[0]
    } else if (period === 'weekly') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = weekStart.toISOString().split('T')[0]
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    const group = groups.get(key) || []
    group.push(entry)
    groups.set(key, group)
  })

  return Array.from(groups.entries())
    .map(([dateStr, groupEntries]) => {
      const avgIntensity =
        groupEntries.reduce((sum, e) => sum + e.intensity, 0) / groupEntries.length

      // Find most common mood in this period
      const moodCounts: Record<MoodType, number> = {} as any
      groupEntries.forEach((e) => {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1
      })
      const mood = Object.entries(moodCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0] as MoodType

      return {
        date: new Date(dateStr),
        averageIntensity: avgIntensity,
        mood,
        category: getMoodCategory(mood),
        entryCount: groupEntries.length,
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Calculate trend direction
 */
function calculateTrendDirection(
  dataPoints: MoodDataPoint[]
): 'improving' | 'declining' | 'stable' {
  if (dataPoints.length < 2) {
    return 'stable'
  }

  const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2))
  const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2))

  const firstAvg = firstHalf.reduce((sum, dp) => sum + dp.averageIntensity, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, dp) => sum + dp.averageIntensity, 0) / secondHalf.length

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
 * Calculate change rate percentage
 */
function calculateChangeRate(dataPoints: MoodDataPoint[]): number {
  if (dataPoints.length < 2) {
    return 0
  }

  const first = dataPoints[0].averageIntensity
  const last = dataPoints[dataPoints.length - 1].averageIntensity

  if (first === 0) {
    return 0
  }

  return ((last - first) / first) * 100
}

/**
 * Detect mood patterns
 */
export async function detectMoodPatterns(userId: string): Promise<MoodPattern[]> {
  const entries = await getMoodEntries(userId)
  const patterns: MoodPattern[] = []

  // Time of day patterns
  const timeOfDayPattern = analyzeTimeOfDayPattern(entries)
  if (timeOfDayPattern) {
    patterns.push(timeOfDayPattern)
  }

  // Trigger patterns
  const triggerPatterns = analyzeTriggerPatterns(entries)
  patterns.push(...triggerPatterns)

  // Activity patterns
  const activityPatterns = analyzeActivityPatterns(entries)
  patterns.push(...activityPatterns)

  return patterns
}

/**
 * Analyze time of day patterns
 */
function analyzeTimeOfDayPattern(entries: MoodEntry[]): MoodPattern | null {
  const timeGroups: Record<string, number[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
  }

  entries.forEach((entry) => {
    const timeOfDay = entry.context?.timeOfDay
    if (timeOfDay) {
      timeGroups[timeOfDay].push(entry.intensity)
    }
  })

  // Find time with best average mood
  let bestTime = ''
  let bestAvg = 0

  Object.entries(timeGroups).forEach(([time, intensities]) => {
    if (intensities.length > 0) {
      const avg = intensities.reduce((sum, i) => sum + i, 0) / intensities.length
      if (avg > bestAvg) {
        bestAvg = avg
        bestTime = time
      }
    }
  })

  if (bestTime) {
    return {
      type: 'time_of_day',
      pattern: `Best mood during ${bestTime}`,
      frequency: timeGroups[bestTime].length,
      correlation: 0.7,
      impact: 'positive',
    }
  }

  return null
}

/**
 * Analyze trigger patterns
 */
function analyzeTriggerPatterns(entries: MoodEntry[]): MoodPattern[] {
  const triggerImpact: Record<string, { intensities: number[]; count: number }> = {}

  entries.forEach((entry) => {
    entry.triggers?.forEach((trigger) => {
      if (!triggerImpact[trigger]) {
        triggerImpact[trigger] = { intensities: [], count: 0 }
      }
      triggerImpact[trigger].intensities.push(entry.intensity)
      triggerImpact[trigger].count++
    })
  })

  return Object.entries(triggerImpact)
    .filter(([_, data]) => data.count >= 3) // At least 3 occurrences
    .map(([trigger, data]) => {
      const avgIntensity = data.intensities.reduce((sum, i) => sum + i, 0) / data.intensities.length
      const impact = avgIntensity < 5 ? 'negative' : avgIntensity > 6 ? 'positive' : 'neutral'

      return {
        type: 'trigger' as const,
        pattern: `Trigger: ${trigger}`,
        frequency: data.count,
        correlation: 0.6,
        impact,
      }
    })
}

/**
 * Analyze activity patterns
 */
function analyzeActivityPatterns(entries: MoodEntry[]): MoodPattern[] {
  const activityImpact: Record<string, { intensities: number[]; count: number }> = {}

  entries.forEach((entry) => {
    entry.activities?.forEach((activity) => {
      if (!activityImpact[activity]) {
        activityImpact[activity] = { intensities: [], count: 0 }
      }
      activityImpact[activity].intensities.push(entry.intensity)
      activityImpact[activity].count++
    })
  })

  return Object.entries(activityImpact)
    .filter(([_, data]) => data.count >= 3)
    .map(([activity, data]) => {
      const avgIntensity = data.intensities.reduce((sum, i) => sum + i, 0) / data.intensities.length
      const impact = avgIntensity < 5 ? 'negative' : avgIntensity > 6 ? 'positive' : 'neutral'

      return {
        type: 'activity' as const,
        pattern: `Activity: ${activity}`,
        frequency: data.count,
        correlation: 0.6,
        impact,
      }
    })
}

/**
 * Get current time of day
 */
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return 'morning'
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon'
  } else if (hour >= 17 && hour < 21) {
    return 'evening'
  } else {
    return 'night'
  }
}
