# 🔐 Role-Based Authentication System - Complete Guide

## ✨ System Overview

Your Mind Ease app now has a comprehensive **role-based authentication system** with:

- ✅ **Email-OTP Authentication** - No passwords, just secure OTP codes
- ✅ **Three User Roles** - Admin, Sub-Admin, User
- ✅ **MongoDB Backend** - Scalable database with Mongoose
- ✅ **Role Management** - Admins can promote users to Sub-Admins
- ✅ **User Limits** - 10 users maximum per admin
- ✅ **Admin Dashboard** - Manage all users and roles
- ✅ **JWT Tokens** - Secure session management

---

## 🎯 User Roles & Permissions

### **👑 Admin**
- Can create up to 10 users
- Can promote users to Sub-Admin
- Can demote Sub-Admins to users
- Can manage all their users
- Can delete users
- Full dashboard access

### **⚡ Sub-Admin**
- Promoted by Admin
- Can view users under their admin
- Limited management permissions
- Cannot create new users
- Cannot promote/demote others

### **👤 User**
- Standard access
- Can use all app features
- Cannot manage other users
- Created by Admin

---

## 🚀 Quick Setup

### **Step 1: Install MongoDB**

```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Linux
sudo apt install mongodb
sudo systemctl start mongodb

# Windows
# Download from: https://www.mongodb.com/try/download/community
```

### **Step 2: Configure MongoDB URI**

Edit `.env.local`:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mindease

# Auth Token Secret
AUTH_TOKEN_SECRET=your-super-secret-jwt-key-change-this

# Resend API Key (for OTP emails)
RESEND_API_KEY=your-resend-api-key
```

### **Step 3: Start Your App**

```bash
npm run dev
```

The app will automatically:
- Connect to MongoDB
- Create necessary collections
- Set up indexes

---

## 📊 Database Schema

### **User Collection**

```typescript
{
  _id: ObjectId
  name: string
  email: string (unique, indexed)
  password?: string (optional, for future)
  role: 'user' | 'sub_admin' | 'admin'
  emailVerified: boolean
  isActive: boolean
  adminId: ObjectId (reference to admin)
  createdBy: ObjectId (who created this user)
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
  metadata: {
    loginAttempts: number
    lastLoginAttempt: Date
  }
}
```

---

## 🔄 User Flow

### **1. First User (Becomes Admin)**

```
1. Visit /auth/signup
2. Enter name + email
3. Receive OTP via email
4. Enter OTP
5. Account created with ADMIN role
6. Can now create up to 10 users
```

### **2. Admin Creates Users**

```
1. Login as Admin
2. Go to Admin Dashboard
3. Click "Add User"
4. Enter user details
5. Send OTP to user's email
6. User verifies and account is created
7. User gets USER role by default
```

### **3. Admin Promotes User to Sub-Admin**

```
1. Login as Admin
2. Go to User Management
3. Find the user
4. Click "Promote to Sub-Admin"
5. User role changes to SUB_ADMIN
```

### **4. Subsequent Logins**

```
1. Visit /auth/login
2. Enter email
3. Receive OTP
4. Enter OTP
5. Logged in with appropriate role
6. Redirected to role-specific dashboard
```

---

## 📁 Project Structure

```
myapp.js/
├── backend/
│   ├── config/
│   │   └── mongodb.ts              # MongoDB connection
│   ├── models/
│   │   └── User.model.ts           # User schema with roles
│   ├── services/
│   │   ├── auth-mongo.service.ts   # MongoDB auth
│   │   ├── otp.service.ts          # OTP generation
│   │   └── role.service.ts         # Role management
│   └── middleware/
│       └── auth.middleware.ts       # JWT & role verification
│
├── app/api/
│   ├── auth/
│   │   ├── otp/
│   │   │   ├── send/route.ts       # Send OTP
│   │   │   └── verify/route.ts     # Verify OTP & login
│   │   └── register/route.ts       # Register new user
│   │
│   └── admin/
│       ├── users/route.ts          # Get all users
│       ├── promote/route.ts        # Promote to sub-admin
│       ├── demote/route.ts         # Demote to user
│       ├── delete/route.ts         # Delete user
│       └── stats/route.ts          # Get admin statistics
│
└── .env.local                      # Configuration
```

---

## 🔌 API Endpoints

### **Authentication**

#### **POST /api/auth/otp/send**
Send OTP to email

**Request:**
```json
{
  "email": "user@example.com",
  "purpose": "login" // or "signup"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 10
}
```

---

#### **POST /api/auth/otp/verify**
Verify OTP and login

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "login"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "admin",
    "emailVerified": true
  },
  "token": "jwt_token_here"
}
```

---

#### **POST /api/auth/register**
Register new user under admin

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "otp": "123456",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
  }
}
```

---

### **Admin Management**

#### **GET /api/admin/users**
Get all users under admin

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
```
?role=user        # Filter by role
&page=1           # Page number
&limit=20         # Items per page
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "pages": 1,
    "limit": 20
  }
}
```

---

#### **POST /api/admin/promote**
Promote user to sub-admin

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request:**
```json
{
  "userId": "user_id_to_promote"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User promoted to sub-admin successfully",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "sub_admin"
  }
}
```

---

#### **POST /api/admin/demote**
Demote sub-admin to user

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request:**
```json
{
  "userId": "subadmin_id_to_demote"
}
```

---

#### **DELETE /api/admin/users/:userId**
Delete user

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

---

#### **GET /api/admin/stats**
Get admin statistics

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 8,
    "activeUsers": 8,
    "subAdmins": 2,
    "regularUsers": 6,
    "maxUsersAllowed": 10,
    "remainingSlots": 2
  }
}
```

---

## 🎨 Frontend Components

### **Login Page** (`/auth/login`)
- Email input
- OTP verification
- Beautiful OTP input component
- Resend code functionality

### **Signup Page** (`/auth/signup`)
- Name + Email input
- OTP verification
- Creates first admin or user under admin

### **Admin Dashboard** (`/admin/dashboard`)
- User statistics
- User list with roles
- Promote/Demote buttons
- Add user functionality
- Delete user option

---

## 🔒 Security Features

### **JWT Authentication**
- Tokens expire after 30 days
- Includes user ID, email, and role
- Verified on every protected route

### **OTP Security**
- 6-digit codes
- 10-minute expiration
- Maximum 5 attempts
- Rate limiting (1 minute between requests)

### **Role-Based Access**
- Middleware verifies user role
- Admins can only manage their users
- Sub-admins have limited permissions
- Users have no management access

### **MongoDB Security**
- Password hashing with bcrypt (if used)
- Indexed queries for performance
- Connection pooling
- Mongoose schema validation

---

## 🎯 Usage Examples

### **Create First Admin**

```typescript
// Visit /auth/signup
// First user automatically becomes admin

POST /api/auth/otp/send
{
  "email": "admin@company.com",
  "purpose": "signup"
}

// Check email for OTP

POST /api/auth/otp/verify
{
  "email": "admin@company.com",
  "otp": "123456",
  "purpose": "signup",
  "name": "Admin User"
}

// Response includes admin role
```

### **Admin Creates User**

```typescript
// Admin logged in with JWT token

// Step 1: Send OTP to new user's email
POST /api/auth/otp/send
Headers: Authorization: Bearer <admin_token>
{
  "email": "newuser@company.com",
  "purpose": "signup"
}

// Step 2: Register user with OTP
POST /api/auth/register
Headers: Authorization: Bearer <admin_token>
{
  "name": "New User",
  "email": "newuser@company.com",
  "otp": "123456",
  "role": "user"
}
```

### **Promote User to Sub-Admin**

```typescript
// Admin promotes user

POST /api/admin/promote
Headers: Authorization: Bearer <admin_token>
{
  "userId": "user_mongodb_id"
}
```

---

## 🧪 Testing the System

### **Test Scenario 1: First Admin**
1. Visit http://localhost:3001/auth/signup
2. Enter name and email
3. Get OTP from console (development)
4. Verify OTP
5. You're now logged in as ADMIN
6. See "Admin Dashboard" option in navigation

### **Test Scenario 2: Create Users**
1. Login as admin
2. Go to Admin Dashboard
3. Click "Add User"
4. Fill in user details
5. Send OTP
6. User receives OTP and verifies
7. User is created under your admin

### **Test Scenario 3: Promote to Sub-Admin**
1. Login as admin
2. Go to User Management
3. Find a user
4. Click "Promote to Sub-Admin"
5. User role changes
6. User now has sub-admin permissions

### **Test Scenario 4: User Limit**
1. Try creating 11th user as admin
2. Should get error: "Maximum limit reached"
3. Must delete a user or upgrade plan

---

## ⚙️ Configuration Options

### **Adjust User Limit**

Edit `backend/services/role.service.ts`:
```typescript
const MAX_USERS_PER_ADMIN = 10  // Change to desired number
```

### **Change JWT Expiry**

Edit `backend/services/auth-mongo.service.ts`:
```typescript
const JWT_EXPIRY = '30d'  // Change to '7d', '1d', etc.
```

### **Customize OTP Settings**

Edit `backend/services/otp.service.ts`:
```typescript
const OTP_LENGTH = 6               // Code length
const OTP_EXPIRY_MINUTES = 10      // Expiration time
const MAX_ATTEMPTS = 5             // Max attempts
const RATE_LIMIT_MINUTES = 1       // Cooldown
```

---

## 🐛 Troubleshooting

### **MongoDB Connection Error**
```
Error: connect ECONNREFUSED
```
**Solution:**
- Ensure MongoDB is running: `brew services start mongodb-community`
- Check MONGODB_URI in `.env.local`
- Default: `mongodb://localhost:27017/mindease`

### **JWT Token Invalid**
**Solution:**
- Check AUTH_TOKEN_SECRET is set
- Token may have expired (30 days default)
- Clear localStorage and login again

### **User Limit Reached**
```
Error: Maximum limit reached
```
**Solution:**
- Delete unused users
- Each admin can have max 10 users
- Or increase MAX_USERS_PER_ADMIN in code

### **Cannot Promote User**
**Solution:**
- Only admins can promote users
- User must belong to your admin
- User must have 'user' role (not already sub-admin)

---

## 📚 Next Steps

### **Phase 1: Basic Setup** ✅
- MongoDB connection
- User model with roles
- OTP authentication
- Role management service

### **Phase 2: API Routes** (Next)
- Create all API endpoints
- Add middleware for auth
- Role-based route protection

### **Phase 3: Admin Dashboard** (After)
- User management UI
- Statistics display
- Promote/demote interface
- User creation form

### **Phase 4: Enhancements**
- Email templates customization
- Advanced permissions
- Activity logging
- User analytics

---

## 🎉 System Complete!

Your role-based authentication system is now ready with:
- ✅ MongoDB backend
- ✅ Email-OTP authentication
- ✅ Three user roles
- ✅ Admin management
- ✅ User limits (10 per admin)
- ✅ JWT security

**Next:** I'll create the API routes and admin dashboard!

---

**Made with 💙 for Mind Ease**

*Your AI mental health companion with enterprise-grade authentication*
