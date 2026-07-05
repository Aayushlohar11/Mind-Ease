import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { User, UserSession } from '@backend/types/user'

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret-change-me'
const TOKEN_EXPIRATION = '7d'

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash)
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, TOKEN_SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  })
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, TOKEN_SECRET)
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded && 'email' in decoded) {
      return {
        userId: String((decoded as any).userId),
        email: String((decoded as any).email),
      }
    }
    return null
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export function createSession(user: User, token: string): UserSession {
  return {
    userId: user.id,
    sessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    token,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }
}

export function sanitizeUser(user: User & { passwordHash?: string }): User {
  const { passwordHash, ...rest } = user
  return rest as User
}
