/**
 * AI service and response type definitions
 */

export type AIModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo'

export type AIServiceType = 'chat' | 'sentiment' | 'recommendation' | 'analytics'

export interface AIRequest {
  type: AIServiceType
  userId: string
  sessionId?: string
  input: string | object
  options?: AIRequestOptions
}

export interface AIRequestOptions {
  model?: AIModel
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  systemPrompt?: string
}

export interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: AIError
  metadata: AIResponseMetadata
}

export interface AIResponseMetadata {
  requestId: string
  model: string
  processingTime: number
  tokensUsed?: TokenUsage
  timestamp: Date
}

export interface TokenUsage {
  prompt: number
  completion: number
  total: number
}

export interface AIError {
  code: string
  message: string
  details?: any
  retryable: boolean
}

export interface ChatCompletionRequest {
  messages: ChatMessage[]
  model?: AIModel
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: ChatChoice[]
  usage: TokenUsage
}

export interface ChatChoice {
  index: number
  message: ChatMessage
  finishReason: 'stop' | 'length' | 'content_filter' | 'null'
}

export interface SentimentAnalysisRequest {
  text: string
  language?: string
}

export interface SentimentAnalysisResponse {
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
  confidence: number
  emotions?: EmotionScores
}

export interface EmotionScores {
  joy: number
  sadness: number
  anger: number
  fear: number
  surprise: number
  disgust: number
}

export interface AIInsight {
  id: string
  userId: string
  type: 'mood_trend' | 'pattern' | 'recommendation' | 'alert'
  title: string
  description: string
  confidence: number
  priority: 'low' | 'medium' | 'high'
  actionable: boolean
  actions?: string[]
  createdAt: Date
  expiresAt?: Date
}

export interface AISystemPrompt {
  role: 'mental_health_support' | 'mood_analysis' | 'content_recommendation'
  prompt: string
  context?: string[]
  constraints?: string[]
}
