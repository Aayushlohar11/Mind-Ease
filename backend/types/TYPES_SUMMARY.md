# Type System Summary

## Overview

This document provides a comprehensive overview of all TypeScript interfaces and types created for the AI-Powered Mental Health Website.

## Files Created

### 1. `user.ts` - User Management Types

**Interfaces:**

- `User` - Core user entity with id, email, name, timestamps
- `UserProfile` - Extended profile (avatar, bio, location, timezone)
- `UserPreferences` - Settings for theme, notifications, privacy, accessibility
- `NotificationPreferences` - Email, push, reminders configuration
- `PrivacyPreferences` - Data sharing and retention settings
- `AccessibilityPreferences` - Font size, contrast, motion, screen reader
- `UserSession` - Session management with tokens and expiry
- `AuthCredentials` - Login credentials
- `AuthResponse` - Authentication response with user and session

**Total: 9 interfaces**

### 2. `message.ts` - Chat & Messaging Types

**Types:**

- `MessageRole` - 'user' | 'assistant' | 'system'
- `MessageStatus` - 'sending' | 'sent' | 'delivered' | 'error'

**Interfaces:**

- `Message` - Chat message with role, content, sentiment, metadata
- `MessageMetadata` - Tokens, model, processing time, errors
- `SentimentScore` - Sentiment analysis results (-1 to 1 scale)
- `SentimentCalculation` - Token-level sentiment breakdown
- `ChatSession` - Conversation session with message count and metadata
- `ChatSessionMetadata` - Average sentiment, topics, summary
- `ChatContext` - Context for AI with messages and parameters
- `ChatMessageInput` - Input for sending messages
- `ChatMessageResponse` - Response with message, session, sentiment

**Total: 2 types, 10 interfaces**

### 3. `mood.ts` - Mood Tracking Types

**Types:**

- `MoodType` - 10 mood states (very_happy, happy, neutral, sad, very_sad, anxious, stressed, calm, energetic, tired)
- `MoodCategory` - 'positive' | 'neutral' | 'negative' | 'anxious'
- `MoodDistribution` - Mapped type for mood frequency
- `CategoryDistribution` - Mapped type for category frequency

**Interfaces:**

- `MoodEntry` - Individual mood entry with intensity, triggers, activities
- `MoodContext` - Contextual data (location, weather, time, social context)
- `MoodHistory` - Historical mood data with date range and summary
- `DateRange` - Start and end dates
- `MoodSummary` - Aggregated mood statistics
- `MoodTrend` - Trend analysis (improving/declining/stable)
- `MoodDataPoint` - Single data point in trend
- `MoodPattern` - Detected patterns with correlation and impact
- `MoodEntryInput` - Input for creating mood entries

**Total: 4 types, 9 interfaces**

### 4. `ai.ts` - AI Service Types

**Types:**

- `AIModel` - 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo'
- `AIServiceType` - 'chat' | 'sentiment' | 'recommendation' | 'analytics'

**Interfaces:**

- `AIRequest` - Generic AI service request
- `AIRequestOptions` - Model parameters (temperature, tokens, etc.)
- `AIResponse<T>` - Generic AI response with metadata
- `AIResponseMetadata` - Request tracking and timing
- `TokenUsage` - Token consumption breakdown
- `AIError` - Error details with retry information
- `ChatCompletionRequest` - OpenAI chat completion request
- `ChatMessage` - OpenAI message format
- `ChatCompletionResponse` - OpenAI response format
- `ChatChoice` - Individual completion choice
- `SentimentAnalysisRequest` - Sentiment analysis input
- `SentimentAnalysisResponse` - Sentiment with confidence and emotions
- `EmotionScores` - Detailed emotion breakdown
- `AIInsight` - AI-generated insights and recommendations
- `AISystemPrompt` - System prompt configuration

**Total: 2 types, 14 interfaces**

### 5. `analytics.ts` - Analytics & Insights Types

**Types:**

- `AnalyticsPeriod` - 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'
- `TrendDirection` - 'improving' | 'declining' | 'stable'
- `InsightType` - 7 insight types (mood_improvement, mood_decline, pattern_detected, etc.)

**Interfaces:**

- `Analytics` - Comprehensive analytics container
- `MoodAnalytics` - Mood-specific analytics with trends and patterns
- `ChatAnalytics` - Chat interaction analytics
- `EngagementAnalytics` - User engagement metrics
- `TriggerAnalysis` - Trigger frequency and impact
- `ActivityAnalysis` - Activity effectiveness analysis
- `TimeDistribution` - Distribution by time of day
- `DayDistribution` - Distribution by day of week
- `Correlation` - Factor correlation analysis
- `SentimentTrendPoint` - Sentiment over time
- `TopicAnalysis` - Chat topic analysis
- `FeatureUsage` - Feature usage tracking
- `Insight` - Actionable insight with recommendations
- `PredictiveInsight` - Predictive analytics
- `AnalyticsQuery` - Query parameters for analytics
- `AnalyticsExport` - Data export structure

**Total: 3 types, 16 interfaces**

### 6. `recommendation.ts` - Content Recommendation Types

**Types:**

- `ContentType` - 'article' | 'exercise' | 'video' | 'audio' | 'resource' | 'activity'
- `ContentCategory` - 10 categories (mindfulness, breathing, meditation, etc.)
- `InteractionType` - 'view' | 'start' | 'complete' | 'bookmark' | 'share' | 'rate'

**Interfaces:**

- `Content` - Content item with metadata
- `ContentMetadata` - Author, rating, effectiveness
- `Recommendation` - Personalized recommendation with reasoning
- `RecommendationReasoning` - Explanation of recommendation logic
- `ReasoningFactor` - Individual reasoning factor
- `RecommendationFeedback` - User feedback on recommendations
- `RecommendationRequest` - Request parameters
- `RecommendationPreferences` - User preferences for content
- `RecommendationResponse` - Response with recommendations
- `ContentInteraction` - User interaction tracking
- `ContentFilter` - Filtering criteria
- `ContentLibrary` - Content catalog with pagination
- `UserContentHistory` - User's content interaction history

**Total: 3 types, 13 interfaces**

### 7. `api.ts` - API Contract Types

**Types:**

- `HTTPMethod` - 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
- `APIStatus` - 'success' | 'error' | 'pending'
- `WebSocketMessageType` - 6 message types (chat_message, typing_indicator, etc.)

**Interfaces:**

- `APIResponse<T>` - Standard API response wrapper
- `APIError` - Error response structure
- `APIMetadata` - Request metadata
- `PaginatedResponse<T>` - Paginated data response
- `Pagination` - Pagination metadata
- `PaginationQuery` - Pagination query parameters
- `LoginRequest` - Login credentials
- `SignupRequest` - Signup data
- `RefreshTokenRequest` - Token refresh
- `SendMessageRequest` - Chat message request
- `GetChatHistoryQuery` - Chat history query
- `CreateMoodEntryRequest` - Mood entry creation
- `GetMoodHistoryQuery` - Mood history query
- `GetAnalyticsQuery` - Analytics query
- `GetRecommendationsQuery` - Recommendations query
- `SubmitFeedbackRequest` - Feedback submission
- `WebSocketMessage<T>` - WebSocket message wrapper
- `WebSocketError` - WebSocket error
- `RateLimitInfo` - Rate limiting information
- `HealthCheckResponse` - Service health status
- `ServiceHealth` - Individual service health
- `ValidationError` - Field validation error
- `ValidationResult` - Validation result

**Total: 3 types, 23 interfaces**

### 8. `index.ts` - Central Export

Exports all types from all modules for convenient importing.

## Statistics

**Total Type Definitions:**

- **Types:** 17 type aliases
- **Interfaces:** 94 interfaces
- **Total:** 111 type definitions across 7 modules

**Coverage:**

- ✅ User management and authentication
- ✅ Chat and messaging with AI
- ✅ Mood tracking and history
- ✅ AI service integration
- ✅ Analytics and insights
- ✅ Content recommendations
- ✅ API contracts and WebSocket
- ✅ Error handling and validation
- ✅ Pagination and filtering
- ✅ Health monitoring

## Usage Examples

### User Authentication

```typescript
import { User, AuthCredentials, AuthResponse } from '@/types'

const credentials: AuthCredentials = {
  email: 'user@example.com',
  password: 'secure-password',
}

const response: AuthResponse = await login(credentials)
```

### Chat Messaging

```typescript
import { Message, ChatSession, SentimentScore } from '@/types'

const message: Message = {
  id: '123',
  sessionId: 'session-456',
  role: 'user',
  content: 'I feel anxious today',
  timestamp: new Date(),
  status: 'sent',
}
```

### Mood Tracking

```typescript
import { MoodEntry, MoodType } from '@/types'

const entry: MoodEntry = {
  id: '789',
  userId: 'user-123',
  mood: 'anxious',
  category: 'anxious',
  intensity: 7,
  timestamp: new Date(),
  triggers: ['work', 'deadline'],
}
```

### Analytics

```typescript
import { Analytics, AnalyticsPeriod } from '@/types'

const analytics: Analytics = await getAnalytics({
  userId: 'user-123',
  period: 'week',
  includeInsights: true,
})
```

### Recommendations

```typescript
import { Recommendation, ContentType } from '@/types'

const recommendations: Recommendation[] = await getRecommendations({
  userId: 'user-123',
  currentMood: 'anxious',
  limit: 5,
})
```

## Type Safety Benefits

1. **Compile-time validation** - Catch errors before runtime
2. **IntelliSense support** - Better IDE autocomplete
3. **Refactoring safety** - Rename and restructure with confidence
4. **Documentation** - Types serve as inline documentation
5. **API contracts** - Clear contracts between frontend and backend
6. **Reduced bugs** - Type mismatches caught early

## Next Steps

1. Implement runtime validation with Zod schemas
2. Create type guards for runtime type checking
3. Add JSDoc comments for complex types
4. Create utility types for common patterns
5. Set up automated type testing
