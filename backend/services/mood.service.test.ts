import { describe, it, expect, beforeEach } from 'vitest'
import {
  createMoodEntry,
  getMoodEntries,
  getMoodHistory,
  getMoodTrends,
  updateMoodEntry,
  deleteMoodEntry,
} from './mood.service'

describe('Mood Service', () => {
  const userId = `test_user_${Date.now()}`

  it('should create a mood entry with correct properties', async () => {
    const entry = await createMoodEntry(userId, {
      mood: 'happy',
      intensity: 8,
      note: 'Had a great walk outside',
      activities: ['nature', 'exercise'],
    })

    expect(entry.id).toBeDefined()
    expect(entry.userId).toBe(userId)
    expect(entry.mood).toBe('happy')
    expect(entry.intensity).toBe(8)
    expect(entry.category).toBe('positive')
  })

  it('should retrieve mood history and calculate summary', async () => {
    const history = await getMoodHistory(userId)
    expect(history.entries.length).toBeGreaterThan(0)
    expect(history.summary).toBeDefined()
    expect(history.summary.totalEntries).toBeGreaterThan(0)
    expect(history.summary.averageIntensity).toBeGreaterThan(0)
  })

  it('should update an existing mood entry', async () => {
    const entries = await getMoodEntries(userId)
    const entry = entries[0]

    const updated = await updateMoodEntry(userId, entry.id, {
      intensity: 10,
      note: 'Updated walk note',
    })

    expect(updated.intensity).toBe(10)
    expect(updated.note).toBe('Updated walk note')
  })

  it('should delete a mood entry', async () => {
    const entries = await getMoodEntries(userId)
    const entryToDelete = entries[0]

    await deleteMoodEntry(userId, entryToDelete.id)

    const remaining = await getMoodEntries(userId)
    expect(remaining.find((e) => e.id === entryToDelete.id)).toBeUndefined()
  })

  it('should generate mood trends', async () => {
    // Create multiple mood entries
    await createMoodEntry(userId, { mood: 'calm', intensity: 7 })
    await createMoodEntry(userId, { mood: 'energetic', intensity: 9 })

    const trends = await getMoodTrends(userId, 'daily')
    expect(trends.period).toBe('daily')
    expect(trends.dataPoints).toBeDefined()
  })
})
