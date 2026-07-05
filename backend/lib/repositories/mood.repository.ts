/**
 * Mood Repository
 * Data access layer for mood entry operations
 */

import { query } from '@backend/lib/db'
import type { MoodCategory, MoodEntry, MoodEntryInput, DateRange } from '@backend/types/mood'

/**
 * Create a new mood entry
 */
export async function createMoodEntry(
  userId: string,
  input: MoodEntryInput,
  category: string,
  timeOfDay: string
): Promise<MoodEntry> {
  const result = await query(
    `INSERT INTO mood_entries (
      user_id, mood, category, intensity, note, triggers, activities,
      context_time_of_day, context_location, context_weather, 
      context_social_context, context_physical_state
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      userId,
      input.mood,
      category,
      input.intensity,
      input.note || null,
      input.triggers || [],
      input.activities || [],
      timeOfDay,
      input.context?.location || null,
      input.context?.weather || null,
      input.context?.socialContext || null,
      input.context?.physicalState || [],
    ]
  )

  const row = result.rows[0]
  return mapRowToMoodEntry(row)
}

/**
 * Get mood entries for a user
 */
export async function getMoodEntries(userId: string, dateRange?: DateRange): Promise<MoodEntry[]> {
  let queryText = `
    SELECT * FROM mood_entries 
    WHERE user_id = $1
  `
  const params: any[] = [userId]

  if (dateRange) {
    queryText += ` AND timestamp >= $2 AND timestamp <= $3`
    params.push(dateRange.start, dateRange.end)
  }

  queryText += ` ORDER BY timestamp DESC`

  const result = await query(queryText, params)
  return result.rows.map(mapRowToMoodEntry)
}

/**
 * Get mood entry by ID
 */
export async function getMoodEntryById(entryId: string): Promise<MoodEntry | null> {
  const result = await query(`SELECT * FROM mood_entries WHERE id = $1`, [entryId])

  if (result.rows.length === 0) {
    return null
  }

  return mapRowToMoodEntry(result.rows[0])
}

/**
 * Update mood entry
 */
export async function updateMoodEntry(
  entryId: string,
  data: Partial<MoodEntryInput>,
  category?: MoodCategory
): Promise<MoodEntry> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.mood !== undefined) {
    updates.push(`mood = $${paramIndex++}`)
    values.push(data.mood)
  }

  if (category !== undefined) {
    updates.push(`category = $${paramIndex++}`)
    values.push(category)
  }

  if (data.intensity !== undefined) {
    updates.push(`intensity = $${paramIndex++}`)
    values.push(data.intensity)
  }

  if (data.note !== undefined) {
    updates.push(`note = $${paramIndex++}`)
    values.push(data.note)
  }

  if (data.triggers !== undefined) {
    updates.push(`triggers = $${paramIndex++}`)
    values.push(data.triggers)
  }

  if (data.activities !== undefined) {
    updates.push(`activities = $${paramIndex++}`)
    values.push(data.activities)
  }

  if (data.context?.location !== undefined) {
    updates.push(`context_location = $${paramIndex++}`)
    values.push(data.context.location)
  }

  if (data.context?.weather !== undefined) {
    updates.push(`context_weather = $${paramIndex++}`)
    values.push(data.context.weather)
  }

  if (data.context?.socialContext !== undefined) {
    updates.push(`context_social_context = $${paramIndex++}`)
    values.push(data.context.socialContext)
  }

  if (data.context?.physicalState !== undefined) {
    updates.push(`context_physical_state = $${paramIndex++}`)
    values.push(data.context.physicalState)
  }

  if (updates.length === 0) {
    const existing = await getMoodEntryById(entryId)
    if (!existing) {
      throw new Error('Mood entry not found')
    }
    return existing
  }

  values.push(entryId)

  const result = await query(
    `UPDATE mood_entries
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )

  if (result.rows.length === 0) {
    throw new Error('Mood entry not found')
  }

  return mapRowToMoodEntry(result.rows[0])
}

/**
 * Delete mood entry
 */
export async function deleteMoodEntry(entryId: string): Promise<void> {
  await query('DELETE FROM mood_entries WHERE id = $1', [entryId])
}

/**
 * Get mood entries count for a user
 */
export async function getMoodEntriesCount(userId: string, dateRange?: DateRange): Promise<number> {
  let queryText = `
    SELECT COUNT(*) as count FROM mood_entries 
    WHERE user_id = $1
  `
  const params: any[] = [userId]

  if (dateRange) {
    queryText += ` AND timestamp >= $2 AND timestamp <= $3`
    params.push(dateRange.start, dateRange.end)
  }

  const result = await query(queryText, params)
  return parseInt(result.rows[0].count, 10)
}

/**
 * Get mood entries grouped by period
 */
export async function getMoodEntriesByPeriod(
  userId: string,
  period: 'day' | 'week' | 'month',
  dateRange?: DateRange
): Promise<any[]> {
  let dateGrouping: string

  switch (period) {
    case 'day':
      dateGrouping = "DATE_TRUNC('day', timestamp)"
      break
    case 'week':
      dateGrouping = "DATE_TRUNC('week', timestamp)"
      break
    case 'month':
      dateGrouping = "DATE_TRUNC('month', timestamp)"
      break
  }

  let queryText = `
    SELECT 
      ${dateGrouping} as period,
      COUNT(*) as entry_count,
      AVG(intensity) as average_intensity,
      MODE() WITHIN GROUP (ORDER BY mood) as dominant_mood,
      MODE() WITHIN GROUP (ORDER BY category) as dominant_category
    FROM mood_entries
    WHERE user_id = $1
  `
  const params: any[] = [userId]

  if (dateRange) {
    queryText += ` AND timestamp >= $2 AND timestamp <= $3`
    params.push(dateRange.start, dateRange.end)
  }

  queryText += `
    GROUP BY ${dateGrouping}
    ORDER BY period DESC
  `

  const result = await query(queryText, params)
  return result.rows
}

/**
 * Get common triggers for a user
 */
export async function getCommonTriggers(
  userId: string,
  limit: number = 10
): Promise<Array<{ trigger: string; count: number }>> {
  const result = await query(
    `SELECT 
      UNNEST(triggers) as trigger,
      COUNT(*) as count
     FROM mood_entries
     WHERE user_id = $1 AND triggers IS NOT NULL
     GROUP BY trigger
     ORDER BY count DESC
     LIMIT $2`,
    [userId, limit]
  )

  return result.rows
}

/**
 * Get common activities for a user
 */
export async function getCommonActivities(
  userId: string,
  limit: number = 10
): Promise<Array<{ activity: string; count: number }>> {
  const result = await query(
    `SELECT 
      UNNEST(activities) as activity,
      COUNT(*) as count
     FROM mood_entries
     WHERE user_id = $1 AND activities IS NOT NULL
     GROUP BY activity
     ORDER BY count DESC
     LIMIT $2`,
    [userId, limit]
  )

  return result.rows
}

/**
 * Get mood distribution for a user
 */
export async function getMoodDistribution(
  userId: string,
  dateRange?: DateRange
): Promise<Record<string, number>> {
  let queryText = `
    SELECT mood, COUNT(*) as count
    FROM mood_entries
    WHERE user_id = $1
  `
  const params: any[] = [userId]

  if (dateRange) {
    queryText += ` AND timestamp >= $2 AND timestamp <= $3`
    params.push(dateRange.start, dateRange.end)
  }

  queryText += ` GROUP BY mood`

  const result = await query(queryText, params)

  const distribution: Record<string, number> = {}
  result.rows.forEach((row) => {
    distribution[row.mood] = parseInt(row.count, 10)
  })

  return distribution
}

/**
 * Get category distribution for a user
 */
export async function getCategoryDistribution(
  userId: string,
  dateRange?: DateRange
): Promise<Record<string, number>> {
  let queryText = `
    SELECT category, COUNT(*) as count
    FROM mood_entries
    WHERE user_id = $1
  `
  const params: any[] = [userId]

  if (dateRange) {
    queryText += ` AND timestamp >= $2 AND timestamp <= $3`
    params.push(dateRange.start, dateRange.end)
  }

  queryText += ` GROUP BY category`

  const result = await query(queryText, params)

  const distribution: Record<string, number> = {}
  result.rows.forEach((row) => {
    distribution[row.category] = parseInt(row.count, 10)
  })

  return distribution
}

/**
 * Map database row to MoodEntry type
 */
function mapRowToMoodEntry(row: any): MoodEntry {
  return {
    id: row.id,
    userId: row.user_id,
    mood: row.mood,
    category: row.category,
    intensity: row.intensity,
    timestamp: row.timestamp,
    note: row.note,
    triggers: row.triggers,
    activities: row.activities,
    context: {
      timeOfDay: row.context_time_of_day,
      location: row.context_location,
      weather: row.context_weather,
      socialContext: row.context_social_context,
      physicalState: row.context_physical_state,
    },
  }
}
