/**
 * Authentication service
 * Handles user registration, login, and session management
 */

import {
  hashPassword,
  verifyPassword,
  generateToken,
  createSession,
  sanitizeUser,
  isValidEmail,
  isValidPassword,
  verifyToken,
} from '@backend/lib/auth-utils'
import type { User, AuthCredentials, AuthResponse } from '@backend/types/user'
import { getUserByEmail, createUser, getUserById } from './user.service'

export interface SignupData extends AuthCredentials {
  name: string
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Register a new user
 */
export async function signup(data: SignupData): Promise<AuthResponse> {
  const { email, password, name } = data

  console.log(`\n📝 Signup attempt started`)
  console.log(`   Email: ${email}`)
  console.log(`   Name: ${name}`)
  console.log(`   Password length: ${password?.length || 0}`)

  // Validate input
  if (!email || !password || !name) {
    console.log(`❌ Missing required fields`)
    throw new AuthError('Email, password, and name are required', 'MISSING_FIELDS')
  }

  if (!isValidEmail(email)) {
    console.log(`❌ Invalid email format`)
    throw new AuthError('Invalid email format', 'INVALID_EMAIL')
  }

  if (!isValidPassword(password)) {
    console.log(`❌ Weak password`)
    throw new AuthError(
      'Password must be at least 8 characters and contain uppercase, lowercase, and number',
      'WEAK_PASSWORD'
    )
  }

  // Check if user already exists
  const existingUser = await getUserByEmail(email.toLowerCase().trim())
  if (existingUser) {
    console.log(`❌ User already exists: ${email}`)
    throw new AuthError('User with this email already exists', 'USER_EXISTS')
  }

  console.log(`✓ Validation passed`)
  console.log(`🔐 Hashing password...`)
  
  // Hash password
  const hashedPassword = await hashPassword(password)
  console.log(`✓ Password hashed (length: ${hashedPassword.length})`)

  // Create user
  const user = await createUser({
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    name,
  })

  console.log(`✅ Signup successful for ${user.email}!\n`)

  // Generate token and session
  const token = generateToken(user.id, user.email)
  const session = createSession(user, token)

  return {
    user: sanitizeUser(user),
    session,
    token,
  }
}

/**
 * Login an existing user
 */
export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  const { email, password } = credentials

  console.log(`\n🔐 Login attempt started`)
  console.log(`   Email: ${email}`)
  console.log(`   Password length: ${password?.length || 0}`)

  // Validate input
  if (!email || !password) {
    console.log(`❌ Missing credentials`)
    throw new AuthError('Email and password are required', 'MISSING_FIELDS')
  }

  // Get user by email
  const user = await getUserByEmail(email.toLowerCase().trim())
  if (!user) {
    console.log(`❌ User not found for email: ${email}`)
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS')
  }

  console.log(`✓ User found: ${user.email} (ID: ${user.id})`)
  console.log(`   Has password hash: ${!!user.passwordHash}`)
  
  if (user.passwordHash) {
    console.log(`   Hash length: ${user.passwordHash.length}`)
    console.log(`   Hash starts with: ${user.passwordHash.substring(0, 7)}`)
  }

  // Verify password
  if (!user.passwordHash) {
    console.log(`❌ No password hash stored for user`)
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS')
  }

  console.log(`🔍 Verifying password...`)
  const isPasswordValid = await verifyPassword(password, user.passwordHash)
  console.log(`   Verification result: ${isPasswordValid}`)
  
  if (!isPasswordValid) {
    console.log(`❌ Password verification failed`)
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS')
  }

  console.log(`✅ Login successful for ${user.email}!\n`)

  // Generate token and session
  const token = generateToken(user.id, user.email)
  const session = createSession(user, token)

  return {
    user: sanitizeUser(user),
    session,
    token,
  }
}

/**
 * Verify a user's session token
 */
export async function verifySession(token: string): Promise<User | null> {
  try {
    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    const user = await getUserById(decoded.userId)
    if (!user) {
      return null
    }

    return sanitizeUser(user)
  } catch (error) {
    return null
  }
}

/**
 * Logout (invalidate session)
 * Note: With JWT, we can't truly invalidate tokens server-side without a blacklist
 * This is a placeholder for client-side token removal
 */
export async function logout(token: string): Promise<void> {
  // In a production app, you might want to:
  // 1. Add token to a blacklist in Redis
  // 2. Store session IDs in database and delete them
  // For now, client will just remove the token
  return
}
