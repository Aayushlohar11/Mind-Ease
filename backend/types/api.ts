/**
 * API contract type definitions
 */

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type APIStatus = 'success' | 'error' | 'pending'

export interface APIResponse<T = any> {
  status: APIStatus
  data?: T
  error?: APIError
  metadata?: APIMetadata
}

export interface APIError {
  code: string
  message: string
  details?: any
  field?: string
  timestamp: Date
}

export interface APIMetadata {
  requestId: string
  timestamp: Date
  duration: number
  version: string
}

export interface PaginatedResponse<T> {
  status: APIStatus
  data: T[]
  pagination: Pagination
  error?: APIError
  metadata?: APIMetadata
}

export interface Pagination {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface PaginationQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Authentication API contracts
export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

// Chat API contracts
export interface SendMessageRequest {
  content: string
  sessionId?: string
}

export interface GetChatHistoryQuery extends PaginationQuery {
  sessionId: string
  startDate?: string
  endDate?: string
}

// Mood API contracts
export interface CreateMoodEntryRequest {
  mood: string
  intensity: number
  note?: string
  triggers?: string[]
  activities?: string[]
  context?: any
}

export interface GetMoodHistoryQuery extends PaginationQuery {
  startDate?: string
  endDate?: string
  moodTypes?: string[]
}

// Analytics API contracts
export interface GetAnalyticsQuery {
  period: string
  startDate?: string
  endDate?: string
  includeInsights?: boolean
  includePredictions?: boolean
}

// Recommendation API contracts
export interface GetRecommendationsQuery {
  currentMood?: string
  limit?: number
  excludeViewed?: boolean
  contentTypes?: string[]
  categories?: string[]
}

export interface SubmitFeedbackRequest {
  recommendationId: string
  helpful: boolean
  completed: boolean
  rating?: number
  comment?: string
}

// WebSocket message types
export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType
  payload: T
  timestamp: Date
  messageId: string
}

export type WebSocketMessageType =
  | 'chat_message'
  | 'typing_indicator'
  | 'presence_update'
  | 'notification'
  | 'error'
  | 'ping'
  | 'pong'

export interface WebSocketError {
  code: string
  message: string
  reconnect: boolean
}

// Rate limiting
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

// Health check
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  timestamp: Date
  services: ServiceHealth[]
}

export interface ServiceHealth {
  name: string
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  lastCheck: Date
}

// Validation
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}
