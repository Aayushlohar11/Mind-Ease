# Backend

Server-side code: API handlers, services, database, and auth.

## Structure

```
backend/
  api/           # API route implementations (wired via app/api re-exports)
  lib/           # Database, auth, env, repositories, WebSocket
  services/      # Business logic
  types/         # Shared TypeScript types
  scripts/       # Setup scripts (env, database)
  middleware/    # API gateway & validation helpers
  server.ts      # Custom server with WebSocket (npm run dev:custom)
```

## Environment

Add secrets in the project root `.env.local`:

- `OPENAI_API_KEY` — AI chat
- `NEXTAUTH_SECRET` — login sessions
- `DATABASE_URL` — optional PostgreSQL
