/**
 * User Database Service
 * PostgreSQL-backed user management
 */

import { db, query } from '@/lib/database'
import type { User, UserProfile, UserPreferences } from '@backend/types/user'

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const users = await db.select<User>('users', ['*'], { id: userId })
  
  if (users.length === 0) {
    return null
  }

  const user = users[0]

  // Load profile and preferences
  const [profiles, preferences] = await Promise.all([
    db.select<UserProfile>('user_profiles', ['*'], { user_id: userId }),
    db.select<UserPreferences>('user_preferences', ['*'], { user_id: userId }),
  ])

  return {
    ...user,
    profile: profiles[0] || undefined,
    preferences: preferences[0] || getDefaultPreferences(userId),
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await db.select<User>('users', ['*'], { email: email.toLowerCase() })
  
  if (users.length === 0) {
    return null
  }

  return getUserById(users[0].id)
}

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string
  password: string
  name: string
}): Promise<User> {
  // Insert user
  const user = await db.insert<User>('users', {
    email: data.email.toLowerCase(),
    name: data.name,
    password_hash: data.password, // Already hashed by auth service
    created_at: new Date(),
    updated_at: new Date(),
  })

  // Create default preferences
  await db.insert('user_preferences', {
    user_id: user.id,
    ...getDefaultPreferences(user.id),
  })

  console.log(`✅ User created in database: ${user.email} (ID: ${user.id})`)

  return getUserById(user.id) as Promise<User>
}

/**
 * Update user basic info
 */
export async function updateUser(
  userId: string,
  data: { name?: string; email?: string }
): Promise<User> {
  const updateData: any = {}
  
  if (data.name) updateData.name = data.name
  if (data.email) updateData.email = data.email.toLowerCase()

  await db.update('users', updateData, { id: userId })

  return getUserById(userId) as Promise<User>
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  // Check if profile exists
  const exists = await db.exists('user_profiles', { user_id: userId })

  if (exists) {
    // Update existing profile
    return await db.update<UserProfile>('user_profiles', data, { user_id: userId })
  } else {
    // Create new profile
    return await db.insert<UserProfile>('user_profiles', {
      user_id: userId,
      ...data,
    })
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const profiles = await db.select<UserProfile>('user_profiles', ['*'], { user_id: userId })
  return profiles[0] || null
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  data: Partial<UserPreferences>
): Promise<UserPreferences> {
  return await db.update<UserPreferences>('user_preferences', data, { user_id: userId })
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const preferences = await db.select<UserPreferences>('user_preferences', ['*'], { user_id: userId })
  return preferences[0] || null
}

/**
 * Delete user and all related data
 */
export async function deleteUser(userId: string): Promise<void> {
  // PostgreSQL CASCADE will handle related data deletion
  await db.delete('users', { id: userId })
  console.log(`🗑️ User deleted from database: ${userId}`)
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [userId]
  )
}

/**
 * Get default preferences
 */
function getDefaultPreferences(userId: string): UserPreferences {
  return {
    userId,
    theme: 'light',
    notifications: {
      email: true,
      push: false,
      moodReminders: true,
      weeklyInsights: true,
      contentRecommendations: true,
    },
    privacy: {
      shareAnonymousData: false,
      allowAnalytics: false,
      dataRetentionDays: 30,
    },
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      reduceMotion: false,
      screenReaderOptimized: false,
    },
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<{
  totalMoodEntries: number
  totalChatSessions: number
  totalMessages: number
  accountAge: number
}> {
  const result = await query<{
    total_mood_entries: string
    total_chat_sessions: string
    total_messages: string
    account_age: string
  }>(`
    SELECT 
      COUNT(DISTINCT me.id) as total_mood_entries,
      COUNT(DISTINCT cs.id) as total_chat_sessions,
      COUNT(DISTINCT cm.id) as total_messages,
      EXTRACT(DAY FROM NOW() - u.created_at) as account_age
    FROM users u
    LEFT JOIN mood_entries me ON u.id = me.user_id
    LEFT JOIN chat_sessions cs ON u.id = cs.user_id
    LEFT JOIN chat_messages cm ON u.id = cm.user_id
    WHERE u.id = $1
    GROUP BY u.id, u.created_at
  `, [userId])

  if (result.rows.length === 0) {
    return {
      totalMoodEntries: 0,
      totalChatSessions: 0,
      totalMessages: 0,
      accountAge: 0,
    }
  }

  const row = result.rows[0]
  return {
    totalMoodEntries: parseInt(row.total_mood_entries),
    totalChatSessions: parseInt(row.total_chat_sessions),
    totalMessages: parseInt(row.total_messages),
    accountAge: parseInt(row.account_age),
  }
}
