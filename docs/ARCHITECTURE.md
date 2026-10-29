# Mind Ease — Architecture

## Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict mode) |
| **UI** | React 18, Tailwind CSS, Radix UI |
| **Auth** | NextAuth v4 (JWT strategy, Credentials provider, Cryptographic OTP Token Verification) |
| **AI** | OpenAI GPT-4 (with local fallback when unconfigured) |
| **Database** | PostgreSQL via `pg` (with in-memory fallback on `globalThis`) |
| **Email** | Nodemailer (SMTP/Gmail) or Resend API |
| **Validation** | Zod |
| **Charts** | Recharts |
| **Testing** | Vitest + Testing Library |

## Directory Structure

```
mind-ease/
├── frontend/                   # 🎨 All client-side UI code
│   ├── components/             # Reusable UI components by domain
│   │   ├── auth/               # AuthLayout, OTPInput, and form controls
│   │   ├── chat/               # ChatContainer, ChatInput, ChatMessage, TypingIndicator
│   │   ├── mood/               # MoodSelector
│   │   ├── analytics/          # AnalyticsDashboard, TrendChart, StatsCard, InsightsPanel
│   │   ├── recommendations/    # RecommendedContent, ContentCard, ContentFilter
│   │   ├── navigation/         # Navbar
│   │   ├── portfolio/          # Background animations & section headers
│   │   ├── providers/          # SessionProvider wrapper
│   │   └── ui/                 # Primitives (button, card, input, spinner, error-boundary)
│   ├── pages/                  # Page UI components
│   │   ├── auth/               # Login, Signup, Error pages
│   │   ├── dashboard/          # Main user dashboard
│   │   ├── chat/               # AI chat screen
│   │   ├── mood/               # Mood tracker
│   │   ├── analytics/          # Mental wellness trends
│   │   ├── recommendations/    # Personalized resources
│   │   ├── profile/            # User profile and settings
│   │   ├── privacy/            # Privacy policy
│   │   ├── page.tsx            # Landing page
│   │   └── layout.tsx          # Root layout with fonts & theme
│   ├── styles/                 # Global styles
│   │   └── globals.css
│   └── lib/                    # Client utilities (cn, formatters)
│       └── utils.ts
│
├── backend/                    # ⚙️ All server-side business logic & services
│   ├── api/                    # API route implementations
│   │   ├── auth/               # NextAuth, OTP send/verify, signup
│   │   ├── chat/               # AI chat completion handler
│   │   ├── health/             # Health check endpoint
│   │   ├── mood/               # Mood CRUD & trends
│   │   ├── analytics/          # Sentiment and mood analytics
│   │   ├── recommendations/    # Personalized resources & interactions
│   │   ├── user/               # User profile, preferences, deletion, export
│   │   └── socket/             # WebSocket route
│   ├── services/               # Business logic & tests
│   │   ├── ai-chat.service.ts
│   │   ├── ai-chat.service.test.ts
│   │   ├── mood.service.ts
│   │   ├── mood.service.test.ts
│   │   ├── otp.service.ts
│   │   ├── otp.service.test.ts
│   │   ├── sentiment.service.ts
│   │   ├── sentiment.service.test.ts
│   │   ├── user.service.ts
│   │   ├── auth.service.ts
│   │   ├── recommendation.service.ts
│   │   └── analytics.service.ts
│   ├── repositories/           # Data access layer (user, mood, message)
│   │   ├── user.repository.ts
│   │   ├── mood.repository.ts
│   │   ├── message.repository.ts
│   │   └── index.ts
│   ├── db/                     # PostgreSQL pool with globalThis singleton
│   │   └── index.ts
│   ├── auth/                   # NextAuth configuration & cryptographic verification
│   │   ├── auth.ts
│   │   └── auth-utils.ts
│   ├── middleware/             # API Gateway, rate limiting & request validation
│   │   ├── api-gateway.ts
│   │   └── validation.ts
│   └── websocket/              # Real-time Socket.IO server
│       ├── websocket-server.ts
│       └── server.ts
│
├── shared/                     # 🔄 Shared cross-cutting code
│   ├── types/                  # Shared TypeScript interfaces (user, message, mood, api, etc.)
│   └── lib/                    # Shared environment and configuration validation
│       └── env.ts
│
├── app/                        # Next.js 14 App Router routing layer
│   ├── (auth)/                 # Re-exports @frontend/pages/auth/*
│   ├── api/                    # Re-exports @backend/api/*
│   ├── layout.tsx              # Re-exports @frontend/pages/layout
│   └── .../page.tsx            # Re-exports @frontend/pages/...
│
├── database/                   # SQL schemas and versioned migrations
│   ├── migrations/             # 001_initial_schema.sql
│   └── schema.sql
├── public/                     # Static assets (favicons, images, logos)
├── scripts/                    # Development, testing, and DB seeding scripts
├── middleware.ts               # Hardened Next.js edge route protection
└── (config files)              # package.json, tsconfig.json, next.config.js, etc.
```

## Data Flow

```
Browser → Next.js Middleware (cryptographically verified JWT check)
  ├── Protected pages → redirect to /auth/login if no valid JWT
  └── API requests → app/api/* → @backend/api/* handlers
       ├── Auth: OTP send/verify → otp.service → Nodemailer/Resend
       ├── Chat: POST /api/chat → ai-chat.service → OpenAI API
       ├── Mood: CRUD /api/mood → mood.service → PG or in-memory
       └── Analytics: GET /api/analytics → analytics.service → mood data
```

## Authentication Flow

1. **Signup**: Email → OTP sent via SMTP/Resend → Verify OTP → Create user → JWT issued via NextAuth
2. **Login**: Email → OTP sent → Verify → Lookup/create user → Cryptographic JWT verification in `authorize()`
3. **Session**: JWT stored in cookie → Middleware cryptographically verifies via `getToken()` on protected routes

## Database Strategy

- **Production** (`DATABASE_URL` set): PostgreSQL via `pg` connection pool pinned to `globalThis`
- **Development** (no `DATABASE_URL`): In-memory Maps on `globalThis` (survives hot-reloads)
- Services use `isDatabaseConfigured()` to branch between PG and in-memory automatically
