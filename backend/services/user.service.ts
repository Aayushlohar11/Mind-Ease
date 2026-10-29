/**
 * User service
 * Handles user CRUD operations and profile management
 * Supports PostgreSQL with in-memory fallback for local development
 */

import { isDatabaseConfigured } from '@backend/db'
import * as userRepository from '@backend/repositories/user.repository'
import type { User, UserProfile, UserPreferences } from '@shared/types/user'

// Persist in-memory storage across hot reloads in development
const globalStore = globalThis as typeof globalThis & {
  __mindeaseUsers?: Map<string, User>
  __mindeaseUsersByEmail?: Map<string, User>
}

const users = globalStore.__mindeaseUsers ?? new Map<string, User>()
const usersByEmail = globalStore.__mindeaseUsersByEmail ?? new Map<string, User>()

globalStore.__mindeaseUsers = users
globalStore.__mindeaseUsersByEmail = usersByEmail

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  if (isDatabaseConfigured()) {
    return userRepository.getUserById(userId)
  }
  return users.get(userId) || null
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  if (isDatabaseConfigured()) {
    return userRepository.getUserByEmail(email)
  }
  return usersByEmail.get(email.toLowerCase()) || null
}

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string
  password: string
  name: string
}): Promise<User> {
  if (isDatabaseConfigured()) {
    return userRepository.createUser({
      email: data.email,
      name: data.name,
      passwordHash: data.password,
    })
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const user: User = {
    id: userId,
    email: data.email.toLowerCase(),
    name: data.name,
    passwordHash: data.password, // Already hashed by auth service before calling this function
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: {
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
    },
  }

  users.set(userId, user)
  usersByEmail.set(data.email.toLowerCase(), user)

  return user
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  if (isDatabaseConfigured()) {
    return userRepository.updateUserProfile(userId, data)
  }

  const user = users.get(userId)
  if (!user) {
    throw new Error('User not found')
  }

  user.profile = {
    userId: user.id,
    ...user.profile,
    ...data,
  }
  user.updatedAt = new Date()

  users.set(userId, user)

  return user.profile
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (isDatabaseConfigured()) {
    return userRepository.getUserProfile(userId)
  }

  const user = users.get(userId)
  if (!user) {
    return null
  }

  return user.profile || { userId: user.id }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  data: Partial<UserPreferences>
): Promise<UserPreferences> {
  if (isDatabaseConfigured()) {
    return userRepository.updateUserPreferences(userId, data)
  }

  const user = users.get(userId)
  if (!user) {
    throw new Error('User not found')
  }

  user.preferences = {
    ...user.preferences,
    ...data,
    userId,
  } as UserPreferences
  user.updatedAt = new Date()

  users.set(userId, user)

  return user.preferences
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (isDatabaseConfigured()) {
    return userRepository.getUserPreferences(userId)
  }

  const user = users.get(userId)
  return user?.preferences || null
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  if (isDatabaseConfigured()) {
    return userRepository.deleteUser(userId)
  }

  const user = users.get(userId)
  if (user) {
    users.delete(userId)
    usersByEmail.delete(user.email.toLowerCase())
  }
}

/**
 * Update user basic info
 */
export async function updateUser(
  userId: string,
  data: { name?: string; email?: string }
): Promise<User> {
  if (isDatabaseConfigured()) {
    return userRepository.updateUser(userId, data)
  }

  const user = users.get(userId)
  if (!user) {
    throw new Error('User not found')
  }

  if (data.name) user.name = data.name
  if (data.email) {
    usersByEmail.delete(user.email.toLowerCase())
    user.email = data.email.toLowerCase()
    usersByEmail.set(user.email, user)
  }
  user.updatedAt = new Date()

  users.set(userId, user)

  return user
}
