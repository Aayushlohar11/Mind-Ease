/**
 * WebSocket Server
 * Handles real-time communication for chat, notifications, and presence
 */

import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { verify } from 'jsonwebtoken'

interface AuthenticatedSocket extends Socket {
  userId?: string
  username?: string
}

interface TypingData {
  userId: string
  username: string
  isTyping: boolean
}

interface MessageData {
  content: string
  timestamp: Date
}

interface PresenceData {
  userId: string
  username: string
  status: 'online' | 'away' | 'offline'
}

let io: SocketIOServer | null = null

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  })

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication token required'))
      }

      // Verify JWT token
      const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'secret') as any
      socket.userId = decoded.sub || decoded.id
      socket.username = decoded.name || decoded.email

      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`)

    // Join user's personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`)
      
      // Broadcast user online status
      io?.emit('presence:update', {
        userId: socket.userId,
        username: socket.username,
        status: 'online',
      })
    }

    // Handle chat messages
    socket.on('chat:message', async (data: MessageData) => {
      try {
        // Broadcast message to user's room
        io?.to(`user:${socket.userId}`).emit('chat:message', {
          userId: socket.userId,
          username: socket.username,
          content: data.content,
          timestamp: new Date(),
        })
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle typing indicators
    socket.on('chat:typing', (data: { isTyping: boolean }) => {
      io?.to(`user:${socket.userId}`).emit('chat:typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: data.isTyping,
      })
    })

    // Handle AI response streaming
    socket.on('chat:ai-response', (data: { content: string; isComplete: boolean }) => {
      socket.emit('chat:ai-response', {
        content: data.content,
        isComplete: data.isComplete,
        timestamp: new Date(),
      })
    })

    // Handle mood updates
    socket.on('mood:update', (data: any) => {
      io?.to(`user:${socket.userId}`).emit('mood:update', {
        userId: socket.userId,
        mood: data.mood,
        intensity: data.intensity,
        timestamp: new Date(),
      })
    })

    // Handle notifications
    socket.on('notification:send', (data: any) => {
      io?.to(`user:${socket.userId}`).emit('notification:receive', {
        ...data,
        timestamp: new Date(),
      })
    })

    // Handle presence updates
    socket.on('presence:update', (data: { status: 'online' | 'away' | 'offline' }) => {
      io?.emit('presence:update', {
        userId: socket.userId,
        username: socket.username,
        status: data.status,
      })
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`)
      
      // Broadcast user offline status
      io?.emit('presence:update', {
        userId: socket.userId,
        username: socket.username,
        status: 'offline',
      })
    })

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  })

  return io
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io
}

/**
 * Send message to specific user
 */
export function sendToUser(userId: string, event: string, data: any): void {
  if (!io) {
    console.warn('WebSocket server not initialized')
    return
  }

  io.to(`user:${userId}`).emit(event, data)
}

/**
 * Broadcast message to all connected users
 */
export function broadcast(event: string, data: any): void {
  if (!io) {
    console.warn('WebSocket server not initialized')
    return
  }

  io.emit(event, data)
}

/**
 * Send notification to user
 */
export function sendNotification(
  userId: string,
  notification: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
  }
): void {
  sendToUser(userId, 'notification:receive', {
    ...notification,
    timestamp: new Date(),
  })
}

/**
 * Close WebSocket server
 */
export function closeWebSocketServer(): void {
  if (io) {
    io.close()
    io = null
    console.log('WebSocket server closed')
  }
}
