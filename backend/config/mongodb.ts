/**
 * MongoDB Connection Configuration
 */

import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindease'

let isConnected = false

export async function connectDB() {
  if (isConnected) {
    console.log('[MongoDB] Using existing connection')
    return
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      // No need for useNewUrlParser and useUnifiedTopology in mongoose 6+
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    isConnected = db.connections[0].readyState === 1
    console.log('[MongoDB] Connected successfully to:', MONGODB_URI)
  } catch (error) {
    console.error('[MongoDB] Connection error:', error)
    throw new Error('Failed to connect to MongoDB')
  }
}

export async function disconnectDB() {
  if (!isConnected) return

  try {
    await mongoose.disconnect()
    isConnected = false
    console.log('[MongoDB] Disconnected successfully')
  } catch (error) {
    console.error('[MongoDB] Disconnect error:', error)
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('[MongoDB] Mongoose connected to DB')
})

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Mongoose connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('[MongoDB] Mongoose disconnected')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB()
  process.exit(0)
})
