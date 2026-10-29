/**
 * Application environment configuration
 *
 * Next.js loads these automatically from:
 *   1. .env.local   <- ADD YOUR API KEYS HERE (recommended)
 *   2. .env
 *
 * First-time setup: npm run setup:env
 */

const PLACEHOLDER_KEY_PATTERNS = [
  'your_openai_api_key',
  'replace-with-real',
  'sk-test-key',
  'sk-your',
  'xxx',
]

export const env = {
  get nodeEnv(): string {
    return process.env.NODE_ENV ?? 'development'
  },

  /** OpenAI - powers AI chat at /chat */
  openai: {
    get apiKey(): string {
      return process.env.OPENAI_API_KEY?.trim() ?? ''
    },
    get model(): string {
      return process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
    },
  },

  /** NextAuth - login / signup / sessions */
  nextAuth: {
    get url(): string {
      return process.env.NEXTAUTH_URL?.trim() || 'http://localhost:3000'
    },
    get secret(): string {
      return process.env.NEXTAUTH_SECRET?.trim() ?? ''
    },
  },

  app: {
    get publicUrl(): string {
      return process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000'
    },
  },
}

/** True when a real OpenAI key is set (not a placeholder) */
export function isOpenAIConfigured(): boolean {
  const key = env.openai.apiKey
  if (!key) {
    return false
  }

  // Allow test API keys in testing environment
  if (process.env.NODE_ENV === 'test') {
    return true
  }

  if (!key.startsWith('sk-')) {
    return false
  }

  const lower = key.toLowerCase()
  return !PLACEHOLDER_KEY_PATTERNS.some((pattern) => lower.includes(pattern))
}

/** True when NextAuth secret is set for production-like auth */
export function isNextAuthConfigured(): boolean {
  const secret = env.nextAuth.secret
  return secret.length > 0 && secret !== 'your_secret_here' && secret !== 'default-secret-change-me'
}
