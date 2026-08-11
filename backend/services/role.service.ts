/**
 * Role Management Service
 * Handles role-based access control and user management
 */

import User, { IUser, UserRole } from '../models/User.model'
import { connectDB } from '../config/mongodb'

const MAX_USERS_PER_ADMIN = 10

/**
 * Check if admin can create more users
 */
export async function canAdminCreateUser(adminId: string): Promise<{
  canCreate: boolean
  currentCount: number
  maxCount: number
  message?: string
}> {
  await connectDB()

  const admin = await User.findById(adminId)
  if (!admin || admin.role !== UserRole.ADMIN) {
    return {
      canCreate: false,
      currentCount: 0,
      maxCount: MAX_USERS_PER_ADMIN,
      message: 'Invalid admin',
    }
  }

  const userCount = await User.countDocuments({ adminId: admin._id })

  if (userCount >= MAX_USERS_PER_ADMIN) {
    return {
      canCreate: false,
      currentCount: userCount,
      maxCount: MAX_USERS_PER_ADMIN,
      message: `Maximum limit reached. You can only manage ${MAX_USERS_PER_ADMIN} users.`,
    }
  }

  return {
    canCreate: true,
    currentCount: userCount,
    maxCount: MAX_USERS_PER_ADMIN,
  }
}

/**
 * Promote user to sub-admin
 */
export async function promoteToSubAdmin(
  adminId: string,
  targetUserId: string
): Promise<{
  success: boolean
  message: string
  user?: IUser
}> {
  await connectDB()

  // Verify admin exists and has admin role
  const admin = await User.findById(adminId)
  if (!admin || admin.role !== UserRole.ADMIN) {
    return {
      success: false,
      message: 'Only admins can promote users to sub-admin',
    }
  }

  // Find target user
  const targetUser = await User.findById(targetUserId)
  if (!targetUser) {
    return {
      success: false,
      message: 'User not found',
    }
  }

  // Check if user belongs to this admin
  if (String(targetUser.adminId) !== String(admin._id)) {
    return {
      success: false,
      message: 'You can only promote users you created',
    }
  }

  // Check if already sub-admin or admin
  if (targetUser.role === UserRole.SUB_ADMIN) {
    return {
      success: false,
      message: 'User is already a sub-admin',
    }
  }

  if (targetUser.role === UserRole.ADMIN) {
    return {
      success: false,
      message: 'Cannot modify admin users',
    }
  }

  // Promote to sub-admin
  targetUser.role = UserRole.SUB_ADMIN
  await targetUser.save()

  return {
    success: true,
    message: 'User promoted to sub-admin successfully',
    user: targetUser,
  }
}

/**
 * Demote sub-admin to user
 */
export async function demoteToUser(
  adminId: string,
  targetUserId: string
): Promise<{
  success: boolean
  message: string
  user?: IUser
}> {
  await connectDB()

  // Verify admin
  const admin = await User.findById(adminId)
  if (!admin || admin.role !== UserRole.ADMIN) {
    return {
      success: false,
      message: 'Only admins can demote sub-admins',
    }
  }

  // Find target user
  const targetUser = await User.findById(targetUserId)
  if (!targetUser) {
    return {
      success: false,
      message: 'User not found',
    }
  }

  // Check if user belongs to this admin
  if (String(targetUser.adminId) !== String(admin._id)) {
    return {
      success: false,
      message: 'You can only demote users you manage',
    }
  }

  // Check if user is sub-admin
  if (targetUser.role !== UserRole.SUB_ADMIN) {
    return {
      success: false,
      message: 'User is not a sub-admin',
    }
  }

  // Demote to user
  targetUser.role = UserRole.USER
  await targetUser.save()

  return {
    success: true,
    message: 'Sub-admin demoted to user successfully',
    user: targetUser,
  }
}

/**
 * Get users managed by admin
 */
export async function getAdminUsers(
  adminId: string,
  options: {
    role?: UserRole
    page?: number
    limit?: number
  } = {}
): Promise<{
  users: IUser[]
  total: number
  page: number
  pages: number
}> {
  await connectDB()

  const admin = await User.findById(adminId)
  if (!admin || admin.role !== UserRole.ADMIN) {
    throw new Error('Invalid admin')
  }

  const page = options.page || 1
  const limit = options.limit || 20
  const skip = (page - 1) * limit

  const query: any = { adminId: admin._id }
  if (options.role) {
    query.role = options.role
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password'),
    User.countDocuments(query),
  ])

  return {
    users,
    total,
    page,
    pages: Math.ceil(total / limit),
  }
}

/**
 * Delete user (only by admin who created them)
 */
export async function deleteUser(
  adminId: string,
  targetUserId: string
): Promise<{
  success: boolean
  message: string
}> {
  await connectDB()

  // Verify admin
  const admin = await User.findById(adminId)
  if (!admin || admin.role !== UserRole.ADMIN) {
    return {
      success: false,
      message: 'Only admins can delete users',
    }
  }

  // Find target user
  const targetUser = await User.findById(targetUserId)
  if (!targetUser) {
    return {
      success: false,
      message: 'User not found',
    }
  }

  // Check if user belongs to this admin
  if (String(targetUser.adminId) !== String(admin._id)) {
    return {
      success: false,
      message: 'You can only delete users you created',
    }
  }

  // Cannot delete admin users
  if (targetUser.role === UserRole.ADMIN) {
    return {
      success: false,
      message: 'Cannot delete admin users',
    }
  }

  // Delete user
  await User.findByIdAndDelete(targetUserId)

  return {
    success: true,
    message: 'User deleted successfully',
  }
}

/**
 * Get user statistics for admin
 */
export async function getAdminStats(adminId: string): Promise<{
  totalUsers: number
  activeUsers: number
  subAdmins: number
  regularUsers: number
  maxUsersAllowed: number
  remainingSlots: number
}> {
  await connectDB()

  const admin = await User.findById(adminId)
  if (!admin || admin.role !== UserRole.ADMIN) {
    throw new Error('Invalid admin')
  }

  const [totalUsers, activeUsers, subAdmins, regularUsers] = await Promise.all([
    User.countDocuments({ adminId: admin._id }),
    User.countDocuments({ adminId: admin._id, isActive: true }),
    User.countDocuments({ adminId: admin._id, role: UserRole.SUB_ADMIN }),
    User.countDocuments({ adminId: admin._id, role: UserRole.USER }),
  ])

  return {
    totalUsers,
    activeUsers,
    subAdmins,
    regularUsers,
    maxUsersAllowed: MAX_USERS_PER_ADMIN,
    remainingSlots: Math.max(0, MAX_USERS_PER_ADMIN - totalUsers),
  }
}
