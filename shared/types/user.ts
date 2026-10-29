/**
 * User-related type definitions
 */

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
  passwordHash?: string
  profile?: UserProfile
  preferences?: UserPreferences
}

export interface UserProfile {
  userId: string
  avatarUrl?: string
  bio?: string
  dateOfBirth?: Date
  location?: string
  timezone?: string
}

export interface UserPreferences {
  userId: string
  theme: 'light' | 'dark' | 'system'
  notifications: NotificationPreferences
  privacy: PrivacyPreferences
  accessibility: AccessibilityPreferences
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  moodReminders: boolean
  weeklyInsights: boolean
  contentRecommendations: boolean
}

export interface PrivacyPreferences {
  shareAnonymousData: boolean
  allowAnalytics: boolean
  dataRetentionDays: number
}

export interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large'
  highContrast: boolean
  reduceMotion: boolean
  screenReaderOptimized: boolean
}

export interface UserSession {
  userId: string
  sessionId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  session: UserSession
  token: string
}
