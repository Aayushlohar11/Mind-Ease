# Type Definitions

This directory contains all TypeScript type definitions and interfaces for the AI-Powered Mental Health Website.

## Structure

### Core Data Models

#### `user.ts`

Defines user-related types including:

- `User` - Core user profile and authentication data
- `UserProfile` - Extended user profile information
- `UserPreferences` - User settings for theme, notifications, privacy, and accessibility
- `UserSession` - Session management and authentication tokens
- `AuthCredentials` & `AuthResponse` - Authentication flow types

#### `message.ts`

Defines chat and messaging types including:

- `Message` - Individual chat messages with role, content, and sentiment
- `ChatSession` - Chat conversation sessions with metadata
- `MessageRole` - Type-safe message roles (user, assistant, system)
- `SentimentScore` - Sentiment analysis results for messages
- `ChatContext` - Context management for AI conversations

#### `mood.ts`

Defines mood tracking types including:

- `MoodEntry` - Individual mood entries with intensity, triggers, and context
- `MoodType` - Enumeration of mood states (happy, sad, anxious, etc.)
- `MoodHistory` - Historical mood data with summaries
- `MoodTrend` - Trend analysis over time periods
- `MoodPattern` - Pattern detection in mood data

### AI Services

#### `ai.ts`

Defines AI service types including:

- `AIRequest` & `AIResponse` - Generic AI service request/response contracts
- `ChatCompletionRequest` & `ChatCompletionResponse` - OpenAI chat completion types
- `SentimentAnalysisRequest` & `SentimentAnalysisResponse` - Sentiment analysis types
- `AIInsight` - AI-generated insights and recommendations
- `TokenUsage` - Token consumption tracking

### Analytics & Insights

#### `analytics.ts`

Defines analytics types including:

- `Analytics` - Comprehensive analytics data structure
- `MoodAnalytics` - Mood-specific analytics and trends
- `ChatAnalytics` - Chat interaction analytics
- `EngagementAnalytics` - User engagement metrics
- `Insight` - Actionable insights from data analysis
- `PredictiveInsight` - Predictive analytics and forecasting

### Content & Recommendations

#### `recommendation.ts`

Defines content recommendation types including:

- `Content` - Content items (articles, exercises, videos, etc.)
- `Recommendation` - Personalized content recommendations
- `RecommendationReasoning` - Explanation of recommendation logic
- `ContentInteraction` - User interactions with content
- `ContentLibrary` - Content catalog and filtering

### API Contracts

#### `api.ts`

Defines API contract types including:

- `APIResponse` - Standard API response wrapper
- `PaginatedResponse` - Paginated data responses
- `APIError` - Error response structure
- `WebSocketMessage` - WebSocket message types
- Request/response types for all API endpoints
- `HealthCheckResponse` - Service health monitoring

## Usage

Import types from the central index file:

```typescript
import { User, Message, MoodEntry, Analytics } from '@/types'
```

Or import specific type files:

```typescript
import { User, UserPreferences } from '@/types/user'
import { Message, ChatSession } from '@/types/message'
```

## Type Safety Guidelines

1. **Always use defined types** - Never use `any` when a specific type exists
2. **Extend types properly** - Use `Partial<T>`, `Pick<T>`, `Omit<T>` for variations
3. **Use discriminated unions** - For types with multiple variants (e.g., `MessageRole`)
4. **Document complex types** - Add JSDoc comments for non-obvious types
5. **Keep types DRY** - Reuse and compose types rather than duplicating

## Adding New Types

When adding new types:

1. Create a new file or add to an existing logical grouping
2. Export types from the file
3. Add the export to `index.ts`
4. Document the types in this README
5. Run `npm run build` to verify TypeScript compilation

## Type Validation

Types are validated at compile-time by TypeScript. For runtime validation, use:

- `zod` for schema validation (already installed)
- Type guards for runtime type checking
- Validation utilities in `/lib/validation.ts`

## Related Files

- `/lib/utils.ts` - Type utility functions
- `/lib/validation.ts` - Runtime validation schemas
- `tsconfig.json` - TypeScript configuration
