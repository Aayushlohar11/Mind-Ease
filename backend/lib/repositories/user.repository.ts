/**
 * User Repository
 * Data access layer for user-related operations
 */

import { query, transaction } from '@backend/lib/db'
import type { User, UserProfile, UserPreferences } from '@backend/types/user'
import type { PoolClient } from 'pg'

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string
  passwordHash: string
  name: string
}): Promise<User> {
  return transaction(async (client: PoolClient) => {
    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at, updated_at`,
      [data.email, data.name, data.passwordHash]
    )

    const user = userResult.rows[0]

    // Create default preferences
    await client.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)`,
      [user.id]
    )

    // Fetch preferences
    const prefsResult = await client.query(
      `SELECT 
        user_id as "userId",
        theme,
        notifications,
        privacy,
        accessibility
       FROM user_preferences
       WHERE user_id = $1`,
      [user.id]
    )

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      preferences: prefsResult.rows[0],
    }
  })
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const result = await query(
    `SELECT 
      u.id,
      u.email,
      u.name,
      u.created_at,
      u.updated_at,
      up.avatar_url,
      up.bio,
      up.date_of_birth,
      up.location,
      up.timezone,
      upr.theme,
      upr.notifications,
      upr.privacy,
      upr.accessibility
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     LEFT JOIN user_preferences upr ON u.id = upr.user_id
     WHERE u.id = $1`,
    [userId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    profile: row.avatar_url
      ? {
          userId: row.id,
          avatarUrl: row.avatar_url,
          bio: row.bio,
          dateOfBirth: row.date_of_birth,
          location: row.location,
          timezone: row.timezone,
        }
      : undefined,
    preferences: {
      userId: row.id,
      theme: row.theme,
      notifications: row.notifications,
      privacy: row.privacy,
      accessibility: row.accessibility,
    },
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    `SELECT 
      u.id,
      u.email,
      u.name,
      u.password_hash,
      u.created_at,
      u.updated_at,
      up.avatar_url,
      up.bio,
      up.date_of_birth,
      up.location,
      up.timezone,
      upr.theme,
      upr.notifications,
      upr.privacy,
      upr.accessibility
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     LEFT JOIN user_preferences upr ON u.id = upr.user_id
     WHERE u.email = $1`,
    [email]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    profile: row.avatar_url
      ? {
          userId: row.id,
          avatarUrl: row.avatar_url,
          bio: row.bio,
          dateOfBirth: row.date_of_birth,
          location: row.location,
          timezone: row.timezone,
        }
      : undefined,
    preferences: {
      userId: row.id,
      theme: row.theme,
      notifications: row.notifications,
      privacy: row.privacy,
      accessibility: row.accessibility,
    },
  } as any // Include password_hash for auth
}

/**
 * Update user basic info
 */
export async function updateUser(
  userId: string,
  data: { name?: string; email?: string }
): Promise<User> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }

  if (data.email !== undefined) {
    updates.push(`email = $${paramIndex++}`)
    values.push(data.email)
  }

  values.push(userId)

  const result = await query(
    `UPDATE users
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, email, name, created_at, updated_at`,
    values
  )

  if (result.rows.length === 0) {
    throw new Error('User not found')
  }

  const user = await getUserById(userId)
  if (!user) {
    throw new Error('User not found after update')
  }

  return user
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  await query('DELETE FROM users WHERE id = $1', [userId])
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.avatarUrl !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`)
    values.push(data.avatarUrl)
  }

  if (data.bio !== undefined) {
    updates.push(`bio = $${paramIndex++}`)
    values.push(data.bio)
  }

  if (data.dateOfBirth !== undefined) {
    updates.push(`date_of_birth = $${paramIndex++}`)
    values.push(data.dateOfBirth)
  }

  if (data.location !== undefined) {
    updates.push(`location = $${paramIndex++}`)
    values.push(data.location)
  }

  if (data.timezone !== undefined) {
    updates.push(`timezone = $${paramIndex++}`)
    values.push(data.timezone)
  }

  values.push(userId)

  // Upsert profile
  if (updates.length > 0) {
    await query(
      `INSERT INTO user_profiles (user_id, ${updates.map((u) => u.split(' = ')[0]).join(', ')})
       VALUES ($${paramIndex}, ${updates.map((_, i) => `$${i + 1}`).join(', ')})
       ON CONFLICT (user_id) 
       DO UPDATE SET ${updates.join(', ')}`,
      values
    )
  }

  const result = await query(
    `SELECT 
      user_id as "userId",
      avatar_url as "avatarUrl",
      bio,
      date_of_birth as "dateOfBirth",
      location,
      timezone
     FROM user_profiles
     WHERE user_id = $1`,
    [userId]
  )

  return result.rows[0]
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const result = await query(
    `SELECT 
      user_id as "userId",
      avatar_url as "avatarUrl",
      bio,
      date_of_birth as "dateOfBirth",
      location,
      timezone
     FROM user_profiles
     WHERE user_id = $1`,
    [userId]
  )

  return result.rows.length > 0 ? result.rows[0] : null
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  data: Partial<UserPreferences>
): Promise<UserPreferences> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.theme !== undefined) {
    updates.push(`theme = $${paramIndex++}`)
    values.push(data.theme)
  }

  if (data.notifications !== undefined) {
    updates.push(`notifications = $${paramIndex++}`)
    values.push(JSON.stringify(data.notifications))
  }

  if (data.privacy !== undefined) {
    updates.push(`privacy = $${paramIndex++}`)
    values.push(JSON.stringify(data.privacy))
  }

  if (data.accessibility !== undefined) {
    updates.push(`accessibility = $${paramIndex++}`)
    values.push(JSON.stringify(data.accessibility))
  }

  values.push(userId)

  await query(
    `UPDATE user_preferences
     SET ${updates.join(', ')}
     WHERE user_id = $${paramIndex}`,
    values
  )

  const result = await query(
    `SELECT 
      user_id as "userId",
      theme,
      notifications,
      privacy,
      accessibility
     FROM user_preferences
     WHERE user_id = $1`,
    [userId]
  )

  return result.rows[0]
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const result = await query(
    `SELECT 
      user_id as "userId",
      theme,
      notifications,
      privacy,
      accessibility
     FROM user_preferences
     WHERE user_id = $1`,
    [userId]
  )

  return result.rows.length > 0 ? result.rows[0] : null
}
