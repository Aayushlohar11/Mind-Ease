/**
 * Chat Database Service
 * PostgreSQL-backed chat message storage
 */

import { db, query, transaction } from '@/lib/database'
import type { Message, ChatSession } from '@backend/types/message'

/**
 * Create a new chat session
 */
export async function createChatSession(userId: string, title?: string): Promise<ChatSession> {
  const session = await db.insert<ChatSession>('chat_sessions', {
    user_id: userId,
    title: title || 'New Chat',
    started_at: new Date(),
    is_active: true,
    message_count: 0,
  })

  console.log(`✅ Chat session created: ${session.id}`)
  return session
}

/**
 * Get chat session by ID
 */
export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const sessions = await db.select<ChatSession>('chat_sessions', ['*'], { id: sessionId })
  return sessions[0] || null
}

/**
 * Get user's chat sessions
 */
export async function getUserChatSessions(
  userId: string,
  limit: number = 20
): Promise<ChatSession[]> {
  const result = await query<ChatSession>(`
    SELECT * FROM chat_sessions
    WHERE user_id = $1
    ORDER BY started_at DESC
    LIMIT $2
  `, [userId, limit])

  return result.rows
}

/**
 * Get active chat session for user
 */
export async function getActiveChatSession(userId: string): Promise<ChatSession | null> {
  const sessions = await db.select<ChatSession>(
    'chat_sessions',
    ['*'],
    { user_id: userId, is_active: true },
    'started_at DESC',
    1
  )

  return sessions[0] || null
}

/**
 * End a chat session
 */
export async function endChatSession(sessionId: string): Promise<void> {
  await db.update('chat_sessions', {
    is_active: false,
    ended_at: new Date(),
  }, { id: sessionId })

  console.log(`✅ Chat session ended: ${sessionId}`)
}

/**
 * Save a chat message
 */
export async function saveChatMessage(data: {
  sessionId: string
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string
  tokensUsed?: number
  responseTimeMs?: number
  sentimentScore?: number
  sentimentLabel?: string
  emotions?: any
  isCrisis?: boolean
  crisisKeywords?: string[]
}): Promise<Message> {
  const message = await db.insert<Message>('chat_messages', {
    session_id: data.sessionId,
    user_id: data.userId,
    role: data.role,
    content: data.content,
    model: data.model,
    tokens_used: data.tokensUsed,
    response_time_ms: data.responseTimeMs,
    sentiment_score: data.sentimentScore,
    sentiment_label: data.sentimentLabel,
    emotions: data.emotions ? JSON.stringify(data.emotions) : null,
    is_crisis: data.isCrisis || false,
    crisis_keywords: data.crisisKeywords || [],
    timestamp: new Date(),
  })

  console.log(`✅ Chat message saved: ${message.role} - ${message.content.substring(0, 50)}...`)

  return message
}

/**
 * Get messages for a chat session
 */
export async function getSessionMessages(
  sessionId: string,
  limit: number = 100
): Promise<Message[]> {
  const result = await query<Message>(`
    SELECT * FROM chat_messages
    WHERE session_id = $1
    ORDER BY timestamp ASC
    LIMIT $2
  `, [sessionId, limit])

  return result.rows
}

/**
 * Get recent messages for a user
 */
export async function getUserRecentMessages(
  userId: string,
  limit: number = 20
): Promise<Message[]> {
  const result = await query<Message>(`
    SELECT * FROM chat_messages
    WHERE user_id = $1
    ORDER BY timestamp DESC
    LIMIT $2
  `, [userId, limit])

  return result.rows
}

/**
 * Get conversation history (last N messages)
 */
export async function getConversationHistory(
  sessionId: string,
  limit: number = 20
): Promise<Message[]> {
  const result = await query<Message>(`
    SELECT * FROM chat_messages
    WHERE session_id = $1
    ORDER BY timestamp DESC
    LIMIT $2
  `, [sessionId, limit])

  // Return in chronological order
  return result.rows.reverse()
}

/**
 * Delete a chat message
 */
export async function deleteChatMessage(messageId: string): Promise<void> {
  await db.delete('chat_messages', { id: messageId })
  console.log(`🗑️ Chat message deleted: ${messageId}`)
}

/**
 * Delete all messages in a session
 */
export async function deleteSessionMessages(sessionId: string): Promise<void> {
  await query('DELETE FROM chat_messages WHERE session_id = $1', [sessionId])
  console.log(`🗑️ All messages deleted for session: ${sessionId}`)
}

/**
 * Get chat statistics for user
 */
export async function getChatStats(userId: string): Promise<{
  totalSessions: number
  totalMessages: number
  averageMessagesPerSession: number
  crisisDetections: number
}> {
  const result = await query<{
    total_sessions: string
    total_messages: string
    crisis_detections: string
  }>(`
    SELECT 
      COUNT(DISTINCT cs.id) as total_sessions,
      COUNT(cm.id) as total_messages,
      COUNT(CASE WHEN cm.is_crisis = true THEN 1 END) as crisis_detections
    FROM chat_sessions cs
    LEFT JOIN chat_messages cm ON cs.id = cm.session_id
    WHERE cs.user_id = $1
  `, [userId])

  const row = result.rows[0]
  const totalSessions = parseInt(row.total_sessions)
  const totalMessages = parseInt(row.total_messages)

  return {
    totalSessions,
    totalMessages,
    averageMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
    crisisDetections: parseInt(row.crisis_detections),
  }
}

/**
 * Search messages by content
 */
export async function searchMessages(
  userId: string,
  searchTerm: string,
  limit: number = 50
): Promise<Message[]> {
  const result = await query<Message>(`
    SELECT * FROM chat_messages
    WHERE user_id = $1
      AND content ILIKE $2
    ORDER BY timestamp DESC
    LIMIT $3
  `, [userId, `%${searchTerm}%`, limit])

  return result.rows
}

/**
 * Get sentiment trends over time
 */
export async function getSentimentTrends(
  userId: string,
  days: number = 30
): Promise<Array<{
  date: string
  averageSentiment: number
  messageCount: number
}>> {
  const result = await query<{
    date: string
    avg_sentiment: string
    message_count: string
  }>(`
    SELECT 
      DATE(timestamp) as date,
      AVG(sentiment_score) as avg_sentiment,
      COUNT(*) as message_count
    FROM chat_messages
    WHERE user_id = $1
      AND role = 'user'
      AND sentiment_score IS NOT NULL
      AND timestamp >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `, [userId])

  return result.rows.map((row) => ({
    date: row.date,
    averageSentiment: parseFloat(row.avg_sentiment),
    messageCount: parseInt(row.message_count),
  }))
}

/**
 * Get crisis message history
 */
export async function getCrisisMessages(userId: string): Promise<Message[]> {
  const result = await query<Message>(`
    SELECT * FROM chat_messages
    WHERE user_id = $1
      AND is_crisis = true
    ORDER BY timestamp DESC
  `, [userId])

  return result.rows
}

/**
 * Update session title
 */
export async function updateSessionTitle(
  sessionId: string,
  title: string
): Promise<void> {
  await db.update('chat_sessions', { title }, { id: sessionId })
  console.log(`✅ Session title updated: ${sessionId} -> ${title}`)
}

/**
 * Get token usage statistics
 */
export async function getTokenUsageStats(userId: string): Promise<{
  totalTokens: number
  averageTokensPerMessage: number
  estimatedCost: number
}> {
  const result = await query<{
    total_tokens: string
    message_count: string
  }>(`
    SELECT 
      SUM(tokens_used) as total_tokens,
      COUNT(*) as message_count
    FROM chat_messages
    WHERE user_id = $1
      AND role = 'assistant'
      AND tokens_used IS NOT NULL
  `, [userId])

  const row = result.rows[0]
  const totalTokens = parseInt(row.total_tokens) || 0
  const messageCount = parseInt(row.message_count) || 0

  // Estimate cost (gpt-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens)
  // Assuming 50/50 split for simplicity
  const estimatedCost = (totalTokens / 1000000) * 0.375

  return {
    totalTokens,
    averageTokensPerMessage: messageCount > 0 ? totalTokens / messageCount : 0,
    estimatedCost,
  }
}
