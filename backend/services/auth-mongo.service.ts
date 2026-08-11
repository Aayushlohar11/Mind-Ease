/**
 * MongoDB Authentication Service with OTP
 */

import jwt from 'jsonwebtoken'
import User, { IUser, UserRole } from '../models/User.model'
import { connectDB } from '../config/mongodb'
import { generateAndSendOTP, verifyOTP } from './otp.service'
import { canAdminCreateUser } from './role.service'

const JWT_SECRET = process.env.AUTH_TOKEN_SECRET || 'your-secret-key'
const JWT_EXPIRY = '30d'

/**
 * Register new user with OTP verification
 */
export async function registerWithOTP(data: {
  name: string
  email: string
  otp: string
  adminId?: string
  role?: UserRole
}): Promise<{
  success: boolean
  message: string
  user?: IUser
  token?: string
}> {
  await connectDB()

  const { name, email, otp, adminId, role = UserRole.USER } = data

  // Verify OTP
  const otpResult = await verifyOTP(email, otp)
  if (!otpResult.success) {
    return {
      success: false,
      message: otpResult.message,
    }
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    return {
      success: false,
      message: 'User with this email already exists',
    }
  }

  // If registering under an admin, verify admin and check limits
  let verifiedAdminId = null
  if (adminId) {
    const admin = await User.findById(adminId)
    if (!admin || admin.role !== UserRole.ADMIN) {
      return {
        success: false,
        message: 'Invalid admin',
      }
    }

    // Check if admin can create more users
    const canCreate = await canAdminCreateUser(adminId)
    if (!canCreate.canCreate) {
      return {
        success: false,
        message: canCreate.message || 'Cannot create more users',
      }
    }

    verifiedAdminId = admin._id
  }

  // Create user
  const user = new User({
    name,
    email: email.toLowerCase(),
    role: adminId ? role : UserRole.ADMIN, // First user is admin, others based on input
    emailVerified: true, // Email verified via OTP
    isActive: true,
    adminId: verifiedAdminId,
    createdBy: adminId || null,
  })

  await user.save()

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  )

  return {
    success: true,
    message: 'User registered successfully',
    user,
    token,
  }
}

/**
 * Login with OTP
 */
export async function loginWithOTP(data: {
  email: string
  otp: string
}): Promise<{
  success: boolean
  message: string
  user?: IUser
  token?: string
}> {
  await connectDB()

  const { email, otp } = data

  // Verify OTP
  const otpResult = await verifyOTP(email, otp)
  if (!otpResult.success) {
    return {
      success: false,
      message: otpResult.message,
    }
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    return {
      success: false,
      message: 'No account found with this email',
    }
  }

  // Check if user is active
  if (!user.isActive) {
    return {
      success: false,
      message: 'Your account has been deactivated',
    }
  }

  // Update last login
  user.lastLogin = new Date()
  await user.save()

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  )

  return {
    success: true,
    message: 'Login successful',
    user,
    token,
  }
}

/**
 * Verify JWT token and get user
 */
export async function verifyToken(token: string): Promise<{
  success: boolean
  user?: IUser
  message?: string
}> {
  try {
    await connectDB()

    const decoded: any = jwt.verify(token, JWT_SECRET)
    
    const user = await User.findById(decoded.userId).select('-password')
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      }
    }

    if (!user.isActive) {
      return {
        success: false,
        message: 'Account deactivated',
      }
    }

    return {
      success: true,
      user,
    }
  } catch (error) {
    return {
      success: false,
      message: 'Invalid or expired token',
    }
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<IUser | null> {
  await connectDB()
  return User.findById(userId).select('-password')
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<IUser | null> {
  await connectDB()
  return User.findOne({ email: email.toLowerCase() }).select('-password')
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    name: string
    email: string
  }>
): Promise<{
  success: boolean
  message: string
  user?: IUser
}> {
  await connectDB()

  const user = await User.findById(userId)
  if (!user) {
    return {
      success: false,
      message: 'User not found',
    }
  }

  // Update fields
  if (updates.name) user.name = updates.name
  if (updates.email) {
    // Check if email is already taken
    const existingUser = await User.findOne({ email: updates.email.toLowerCase() })
    if (existingUser && String(existingUser._id) !== userId) {
      return {
        success: false,
        message: 'Email already in use',
      }
    }
    user.email = updates.email.toLowerCase()
    user.emailVerified = false // Require re-verification
  }

  await user.save()

  return {
    success: true,
    message: 'Profile updated successfully',
    user,
  }
}

/**
 * Deactivate user account
 */
export async function deactivateUser(userId: string): Promise<{
  success: boolean
  message: string
}> {
  await connectDB()

  const user = await User.findById(userId)
  if (!user) {
    return {
      success: false,
      message: 'User not found',
    }
  }

  user.isActive = false
  await user.save()

  return {
    success: true,
    message: 'Account deactivated successfully',
  }
}

/**
 * Reactivate user account
 */
export async function reactivateUser(userId: string): Promise<{
  success: boolean
  message: string
}> {
  await connectDB()

  const user = await User.findById(userId)
  if (!user) {
    return {
      success: false,
      message: 'User not found',
    }
  }

  user.isActive = true
  await user.save()

  return {
    success: true,
    message: 'Account reactivated successfully',
  }
}
