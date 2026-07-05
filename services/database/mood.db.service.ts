/**
 * Mood Database Service
 * PostgreSQL-backed mood tracking
 */

import { db, query } from '@/lib/database'
import type { MoodEntry, MoodHistory, MoodType } from '@/types/mood'

/**
 * Create a new mood entry
 */
export async function createMoodEntry(data: {
  userId: string
  mood: MoodType
  intensity: number
  note?: string
  triggers?: string[]
  activities?: string[]
}): Promise<MoodEntry> {
  const timeOfDay = getTimeOfDay()

  const entry = await db.insert<MoodEntry>('mood_entries', {
    user_id: data.userId,
    mood: data.mood,
    intensity: data.intensity,
    note: data.note,
    triggers: data.triggers || [],
    activities: data.activities || [],
    time_of_day: timeOfDay,
    timestamp: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  })

  // Update triggers and activities statistics
  if (data.triggers && data.triggers.length > 0) {
    await updateTriggerStats(data.userId, data.triggers, data.intensity)
  }

  if (data.activities && data.activities.length > 0) {
    await updateActivityStats(data.userId, data.activities, data.intensity)
  }

  console.log(`✅ Mood entry created: ${entry.mood} (intensity: ${entry.intensity})`)

  return entry
}

/**
 * Get mood entry by ID
 */
export async function getMoodEntryById(entryId: string): Promise<MoodEntry | null> {
  const entries = await db.select<MoodEntry>('mood_entries', ['*'], { id: entryId })
  return entries[0] || null
}

/**
 * Get user's mood history
 */
export async function getMoodHistory(
  userId: string,
  limit: number = 100
): Promise<MoodHistory> {
  // Get mood entries
  const entries = await query<MoodEntry>(`
    SELECT * FROM mood_entries
    WHERE user_id = $1
    ORDER BY timestamp DESC
    LIMIT $2
  `, [userId, limit])

  // Calculate summary statistics
  const summary = await calculateMoodSummary(userId)

  return {
    userId,
    entries: entries.rows,
    summary,
  }
}

/**
 * Get mood entries for a date range
 */
export async function getMoodEntriesByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MoodEntry[]> {
  const result = await query<MoodEntry>(`
    SELECT * FROM mood_entries
    WHERE user_id = $1
      AND timestamp >= $2
      AND timestamp <= $3
    ORDER BY timestamp DESC
  `, [userId, startDate, endDate])

  return result.rows
}

/**
 * Update a mood entry
 */
export async function updateMoodEntry(
  entryId: string,
  data: Partial<MoodEntry>
): Promise<MoodEntry> {
  return await db.update<MoodEntry>('mood_entries', data, { id: entryId })
}

/**
 * Delete a mood entry
 */
export async function deleteMoodEntry(entryId: string): Promise<void> {
  await db.delete('mood_entries', { id: entryId })
  console.log(`🗑️ Mood entry deleted: ${entryId}`)
}

/**
 * Calculate mood summary statistics
 */
async function calculateMoodSummary(userId: string): Promise<{
  totalEntries: number
  averageIntensity: number
  dominantMood: MoodType
  moodDistribution: Record<MoodType, number>
}> {
  // Get total entries and average intensity
  const statsResult = await query<{
    total_entries: string
    avg_intensity: string
  }>(`
    SELECT 
      COUNT(*) as total_entries,
      AVG(intensity) as avg_intensity
    FROM mood_entries
    WHERE user_id = $1
  `, [userId])

  const stats = statsResult.rows[0]
  const totalEntries = parseInt(stats.total_entries)
  const averageIntensity = parseFloat(stats.avg_intensity) || 0

  // Get mood distribution
  const distributionResult = await query<{
    mood: MoodType
    count: string
  }>(`
    SELECT mood, COUNT(*) as count
    FROM mood_entries
    WHERE user_id = $1
    GROUP BY mood
    ORDER BY count DESC
  `, [userId])

  const moodDistribution: Record<string, number> = {}
  let dominantMood: MoodType = 'neutral'
  let maxCount = 0

  distributionResult.rows.forEach((row) => {
    const count = parseInt(row.count)
    moodDistribution[row.mood] = count
    
    if (count > maxCount) {
      maxCount = count
      dominantMood = row.mood
    }
  })

  return {
    totalEntries,
    averageIntensity,
    dominantMood,
    moodDistribution: moodDistribution as Record<MoodType, number>,
  }
}

/**
 * Update trigger statistics
 */
async function updateTriggerStats(
  userId: string,
  triggers: string[],
  intensity: number
): Promise<void> {
  for (const trigger of triggers) {
    const exists = await db.exists('triggers', {
      user_id: userId,
      trigger_name: trigger,
    })

    if (exists) {
      // Update existing trigger
      await query(`
        UPDATE triggers
        SET 
          frequency = frequency + 1,
          average_impact = (average_impact * frequency + $1) / (frequency + 1),
          last_occurred = NOW(),
          updated_at = NOW()
        WHERE user_id = $2 AND trigger_name = $3
      `, [intensity, userId, trigger])
    } else {
      // Create new trigger
      await db.insert('triggers', {
        user_id: userId,
        trigger_name: trigger,
        frequency: 1,
        average_impact: intensity,
        last_occurred: new Date(),
        trend: 'stable',
      })
    }
  }
}

/**
 * Update activity statistics
 */
async function updateActivityStats(
  userId: string,
  activities: string[],
  moodIntensity: number
): Promise<void> {
  for (const activity of activities) {
    const exists = await db.exists('coping_activities', {
      user_id: userId,
      activity_name: activity,
    })

    if (exists) {
      // Update existing activity
      await query(`
        UPDATE coping_activities
        SET 
          times_used = times_used + 1,
          average_mood_improvement = (average_mood_improvement * times_used + $1) / (times_used + 1),
          updated_at = NOW()
        WHERE user_id = $2 AND activity_name = $3
      `, [moodIntensity, userId, activity])
    } else {
      // Create new activity
      await db.insert('coping_activities', {
        user_id: userId,
        activity_name: activity,
        times_used: 1,
        average_mood_improvement: moodIntensity,
        effectiveness_score: 0.5, // Default
      })
    }
  }
}

/**
 * Get time of day based on current hour
 */
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

/**
 * Get mood trends over time
 */
export async function getMoodTrends(
  userId: string,
  days: number = 30
): Promise<Array<{
  date: string
  averageIntensity: number
  moodCount: number
}>> {
  const result = await query<{
    date: string
    avg_intensity: string
    mood_count: string
  }>(`
    SELECT 
      DATE(timestamp) as date,
      AVG(intensity) as avg_intensity,
      COUNT(*) as mood_count
    FROM mood_entries
    WHERE user_id = $1
      AND timestamp >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `, [userId])

  return result.rows.map((row) => ({
    date: row.date,
    averageIntensity: parseFloat(row.avg_intensity),
    moodCount: parseInt(row.mood_count),
  }))
}

/**
 * Get top triggers for user
 */
export async function getTopTriggers(
  userId: string,
  limit: number = 5
): Promise<Array<{
  trigger: string
  frequency: number
  averageImpact: number
  trend: string
}>> {
  const result = await query<{
    trigger_name: string
    frequency: number
    average_impact: number
    trend: string
  }>(`
    SELECT 
      trigger_name,
      frequency,
      average_impact,
      trend
    FROM triggers
    WHERE user_id = $1
    ORDER BY frequency DESC
    LIMIT $2
  `, [userId, limit])

  return result.rows.map((row) => ({
    trigger: row.trigger_name,
    frequency: row.frequency,
    averageImpact: row.average_impact,
    trend: row.trend,
  }))
}

/**
 * Get top coping activities for user
 */
export async function getTopActivities(
  userId: string,
  limit: number = 5
): Promise<Array<{
  activity: string
  frequency: number
  effectiveness: number
}>> {
  const result = await query<{
    activity_name: string
    times_used: number
    effectiveness_score: number
  }>(`
    SELECT 
      activity_name,
      times_used,
      effectiveness_score
    FROM coping_activities
    WHERE user_id = $1
    ORDER BY effectiveness_score DESC, times_used DESC
    LIMIT $2
  `, [userId, limit])

  return result.rows.map((row) => ({
    activity: row.activity_name,
    frequency: row.times_used,
    effectiveness: row.effectiveness_score,
  }))
}
