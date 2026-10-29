/**
 * Message and chat-related type definitions
 */

export type MessageRole = 'user' | 'assistant' | 'system'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'error'

export interface Message {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  timestamp: Date
  status: MessageStatus
  metadata?: MessageMetadata
  sentiment?: SentimentScore
}

export interface MessageMetadata {
  tokens?: number
  model?: string
  processingTime?: number
  error?: string
  retryCount?: number
}

export interface SentimentScore {
  score: number // -1 to 1, where -1 is most negative, 1 is most positive
  comparative: number // normalized score
  calculation: SentimentCalculation[]
  tokens: string[]
  positive: string[]
  negative: string[]
}

export interface SentimentCalculation {
  [token: string]: number
}

export interface ChatSession {
  id: string
  userId: string
  title?: string
  createdAt: Date
  updatedAt: Date
  lastMessageAt?: Date
  messageCount: number
  isActive: boolean
  metadata?: ChatSessionMetadata
}

export interface ChatSessionMetadata {
  averageSentiment?: number
  dominantMood?: string
  topics?: string[]
  summary?: string
}

export interface ChatContext {
  sessionId: string
  messages: Message[]
  systemPrompt: string
  maxTokens?: number
  temperature?: number
}

export interface ChatMessageInput {
  content: string
  sessionId?: string
  role?: MessageRole
}

export interface ChatMessageResponse {
  message: Message
  session: ChatSession
  sentiment?: SentimentScore
}
