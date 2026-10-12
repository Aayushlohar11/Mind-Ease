/**
 * User Model with Role-Based Access Control
 */

import mongoose, { Schema, Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

// User roles enum
export enum UserRole {
  USER = 'user',
  SUB_ADMIN = 'sub_admin',
  ADMIN = 'admin',
}

// User interface
export interface IUser extends Document {
  name: string
  email: string
  password?: string // Optional for OTP-only auth
  role: UserRole
  emailVerified: boolean
  isActive: boolean
  adminId?: mongoose.Types.ObjectId | null // Reference to admin who created this user
  createdBy?: mongoose.Types.ObjectId | null // Who created this user
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  metadata?: {
    loginAttempts?: number
    lastLoginAttempt?: Date
    resetToken?: string
    resetTokenExpiry?: Date
  }
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>
  canManageUser(targetUser: IUser): boolean
  getUserCount(): Promise<number>
}

// User schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      select: false, // Don't include password in queries by default
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastLogin: {
      type: Date,
    },
    metadata: {
      loginAttempts: { type: Number, default: 0 },
      lastLoginAttempt: { type: Date },
      resetToken: { type: String },
      resetTokenExpiry: { type: Date },
    },
  },
    {
    timestamps: true,
    toJSON: {
      transform: function (_doc: any, ret: any) {
        delete ret.password
        delete ret.__v
        ret.id = ret._id
        delete ret._id
        return ret
      },
    },
  }
)

// Indexes
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ adminId: 1 })
userSchema.index({ createdAt: -1 })

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});
  
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

// Check if user can manage another user
userSchema.methods.canManageUser = function (targetUser: IUser): boolean {
  // Admin can manage anyone
  if (this.role === UserRole.ADMIN) return true
  
  // Sub-admin can manage users under their admin
  if (this.role === UserRole.SUB_ADMIN) {
    return (
      targetUser.role === UserRole.USER &&
      String(targetUser.adminId) === String(this.adminId)
    )
  }
  
  // Users cannot manage others
  return false
}

// Get count of users under this admin
userSchema.methods.getUserCount = async function (): Promise<number> {
  if (this.role !== UserRole.ADMIN) return 0
  
  const User = mongoose.model<IUser>('User')
  return User.countDocuments({ adminId: this._id })
}

// Static methods
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() })
}

// Export model
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema)

export default User
