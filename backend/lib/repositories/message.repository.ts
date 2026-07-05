/**
 * Message and Chat Session Repository
 * Data access layer for chat messages and sessions
 */

import { query, transaction } from '@backend/lib/db'
import type { Message, ChatSession, MessageRole, MessageStatus } from '@backend/types/message'
import type { PoolClient } from 'pg'

/**
 * Create a new chat session
 */
export async function createChatSession(userId: string, title?: string): Promise<ChatSession> {
  const result = await query(
    `INSERT INTO chat_sessions (user_id, title)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, title || null]
  )

  const row = result.rows[0]
  return mapRowToChatSession(row)
}

/**
 * Get chat session by ID
 */
export async function getChatSessionById(sessionId: string): Promise<ChatSession | null> {
  const result = await query(
    `SELECT * FROM chat_sessions WHERE id = $1`,
    [sessionId]
  )

  if (result.rows.length === 0) {
    return null
  }

  return mapRowToChatSession(result.rows[0])
}

/**
 * Get all chat sessions for a user
 */
export async function getChatSessionsByUserId(
  userId: string,
  limit?: number
): Promise<ChatSession[]> {
  let queryText = `
    SELECT * FROM chat_sessions 
    WHERE user_id = $1
    ORDER BY last_message_at DESC NULLS LAST, created_at DESC
  `

  const params: any[] = [userId]

  if (limit) {
    queryText += ` LIMIT $2`
    params.push(limit)
  }

  const result = await query(queryText, params)
  return result.rows.map(mapRowToChatSession)
}

/**
 * Get active chat session for a user
 */
export async function getActiveChatSession(userId: string): Promise<ChatSession | null> {
  const result = await query(
    `SELECT * FROM chat_sessions 
     WHERE user_id = $1 AND is_active = true
     ORDER BY last_message_at DESC NULLS LAST, created_at DESC
     LIMIT 1`,
    [userId]
  )

  if (result.rows.length === 0) {
    return null
  }

  return mapRowToChatSession(result.rows[0])
}

/**
 * Update chat session
 */
export async function updateChatSession(
  sessionId: string,
  data: {
    title?: string
    isActive?: boolean
    averageSentiment?: number
    dominantMood?: string
    topics?: string[]
    summary?: string
  }
): Promise<ChatSession> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`)
    values.push(data.title)
  }

  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`)
    values.push(data.isActive)
  }

  if (data.averageSentiment !== undefined) {
    updates.push(`average_sentiment = $${paramIndex++}`)
    values.push(data.averageSentiment)
  }

  if (data.dominantMood !== undefined) {
    updates.push(`dominant_mood = $${paramIndex++}`)
    values.push(data.dominantMood)
  }

  if (data.topics !== undefined) {
    updates.push(`topics = $${paramIndex++}`)
    values.push(data.topics)
  }

  if (data.summary !== undefined) {
    updates.push(`summary = $${paramIndex++}`)
    values.push(data.summary)
  }

  values.push(sessionId)

  const result = await query(
    `UPDATE chat_sessions
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )

  if (result.rows.length === 0) {
    throw new Error('Chat session not found')
  }

  return mapRowToChatSession(result.rows[0])
}

/**
 * Delete chat session (and all its messages via CASCADE)
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await query('DELETE FROM chat_sessions WHERE id = $1', [sessionId])
}

/**
 * Create a new message
 */
export async function createMessage(data: {
  sessionId: string
  role: MessageRole
  content: string
  status?: MessageStatus
  metadata?: any
  sentiment?: {
    score: number
    comparative: number
    tokens: string[]
    positive: string[]
    negative: string[]
  }
}): Promise<Message> {
  return transaction(async (client: PoolClient) => {
    // Insert message
    const result = await client.query(
      `INSERT INTO messages (
        session_id, role, content, status, metadata,
        sentiment_score, sentiment_comparative, sentiment_tokens,
        sentiment_positive, sentiment_negative
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.sessionId,
        data.role,
        data.content,
        data.status || 'sent',
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.sentiment?.score || null,
        data.sentiment?.comparative || null,
        data.sentiment?.tokens || null,
        data.sentiment?.positive || null,
        data.sentiment?.negative || null,
      ]
    )

    // Update session message count and last_message_at
    await client.query(
      `UPDATE chat_sessions
       SET message_count = message_count + 1,
           last_message_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [data.sessionId]
    )

    return mapRowToMessage(result.rows[0])
  })
}

/**
 * Get message by ID
 */
export async function getMessageById(messageId: string): Promise<Message | null> {
  const result = await query(
    `SELECT * FROM messages WHERE id = $1`,
    [messageId]
  )

  if (result.rows.length === 0) {
    return null
  }

  return mapRowToMessage(result.rows[0])
}

/**
 * Get messages for a chat session
 */
export async function getMessagesBySessionId(
  sessionId: string,
  limit?: number,
  offset?: number
): Promise<Message[]> {
  let queryText = `
    SELECT * FROM messages 
    WHERE session_id = $1
    ORDER BY timestamp ASC
  `

  const params: any[] = [sessionId]

  if (limit) {
    queryText += ` LIMIT $2`
    params.push(limit)
  }

  if (offset) {
    queryText += ` OFFSET $${params.length + 1}`
    params.push(offset)
  }

  const result = await query(queryText, params)
  return result.rows.map(mapRowToMessage)
}

/**
 * Get recent messages for a chat session
 */
export async function getRecentMessages(
  sessionId: string,
  limit: number = 20
): Promise<Message[]> {
  const result = await query(
    `SELECT * FROM messages 
     WHERE session_id = $1
     ORDER BY timestamp DESC
     LIMIT $2`,
    [sessionId, limit]
  )

  // Reverse to get chronological order
  return result.rows.reverse().map(mapRowToMessage)
}

/**
 * Update message status
 */
export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus
): Promise<Message> {
  const result = await query(
    `UPDATE messages
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [status, messageId]
  )

  if (result.rows.length === 0) {
    throw new Error('Message not found')
  }

  return mapRowToMessage(result.rows[0])
}

/**
 * Delete message
 */
export async function deleteMessage(messageId: string): Promise<void> {
  await transaction(async (client: PoolClient) => {
    // Get session ID before deleting
    const msgResult = await client.query(
      'SELECT session_id FROM messages WHERE id = $1',
      [messageId]
    )

    if (msgResult.rows.length === 0) {
      return
    }

    const sessionId = msgResult.rows[0].session_id

    // Delete message
    await client.query('DELETE FROM messages WHERE id = $1', [messageId])

    // Update session message count
    await client.query(
      `UPDATE chat_sessions
       SET message_count = message_count - 1
       WHERE id = $1`,
      [sessionId]
    )
  })
}

/**
 * Get message count for a session
 */
export async function getMessageCount(sessionId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) as count FROM messages WHERE session_id = $1`,
    [sessionId]
  )

  return parseInt(result.rows[0].count, 10)
}

/**
 * Calculate average sentiment for a session
 */
export async function calculateSessionAverageSentiment(
  sessionId: string
): Promise<number | null> {
  const result = await query(
    `SELECT AVG(sentiment_score) as avg_sentiment
     FROM messages
     WHERE session_id = $1 AND sentiment_score IS NOT NULL`,
    [sessionId]
  )

  const avgSentiment = result.rows[0].avg_sentiment
  return avgSentiment ? parseFloat(avgSentiment) : null
}

/**
 * Map database row to ChatSession type
 */
function mapRowToChatSession(row: any): ChatSession {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
    messageCount: row.message_count,
    isActive: row.is_active,
    metadata: {
      averageSentiment: row.average_sentiment,
      dominantMood: row.dominant_mood,
      topics: row.topics,
      summary: row.summary,
    },
  }
}

/**
 * Map database row to Message type
 */
function mapRowToMessage(row: any): Message {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    timestamp: row.timestamp,
    status: row.status,
    metadata: row.metadata,
    sentiment: row.sentiment_score
      ? {
          score: parseFloat(row.sentiment_score),
          comparative: parseFloat(row.sentiment_comparative),
          calculation: [],
          tokens: row.sentiment_tokens || [],
          positive: row.sentiment_positive || [],
          negative: row.sentiment_negative || [],
        }
      : undefined,
  }
}
