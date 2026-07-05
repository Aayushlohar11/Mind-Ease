/**
 * Unit tests for AI Chat Service
 * Tests API client error handling, message formatting, context management, and conversation history
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import {
  generateChatResponse,
  buildChatContext,
  pruneConversationHistory,
  createMessage,
  detectCrisisKeywords,
  getCrisisResponseMessage,
  getMentalHealthSystemPrompt,
  AIChatErrorCode,
} from './ai-chat.service'
import type { Message } from '@backend/types/message'

// Mock the entire OpenAI module
const mockCreate = vi.fn()

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  }
})

describe('AI Chat Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockClear()
    // Ensure environment variables are set
    process.env.OPENAI_API_KEY = 'test-api-key'
    process.env.OPENAI_MODEL = 'gpt-4-turbo'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createMessage', () => {
    it('should create a message with correct properties', () => {
      const content = 'Hello, how are you?'
      const role = 'user'
      const sessionId = 'session-123'

      const message = createMessage(content, role, sessionId)

      expect(message).toMatchObject({
        content,
        role,
        sessionId,
        status: 'sent',
      })
      expect(message.id).toMatch(/^msg_/)
      expect(message.timestamp).toBeInstanceOf(Date)
    })

    it('should include metadata when provided', () => {
      const metadata = { tokens: 10, model: 'gpt-4' }
      const message = createMessage('Test', 'user', 'session-1', metadata)

      expect(message.metadata).toEqual(metadata)
    })
  })

  describe('buildChatContext', () => {
    it('should build context with system prompt and messages', () => {
      const messages: Message[] = [
        createMessage('Hello', 'user', 'session-1'),
        createMessage('Hi there!', 'assistant', 'session-1'),
      ]

      const context = buildChatContext(messages)

      expect(context.messages).toHaveLength(3) // system + 2 messages
      expect(context.messages[0].role).toBe('system')
      expect(context.messages[1].content).toBe('Hello')
      expect(context.messages[2].content).toBe('Hi there!')
    })

    it('should use custom system prompt when provided', () => {
      const customPrompt = 'Custom system prompt'
      const messages: Message[] = [createMessage('Test', 'user', 'session-1')]

      const context = buildChatContext(messages, customPrompt)

      expect(context.messages[0].content).toBe(customPrompt)
    })

    it('should limit context to MAX_CONTEXT_MESSAGES', () => {
      // Create 25 messages (more than MAX_CONTEXT_MESSAGES = 20)
      const messages: Message[] = Array.from({ length: 25 }, (_, i) =>
        createMessage(`Message ${i}`, 'user', 'session-1')
      )

      const context = buildChatContext(messages)

      // Should have system prompt + 20 most recent messages
      expect(context.messages).toHaveLength(21)
      // Check that it kept the most recent messages
      expect(context.messages[context.messages.length - 1].content).toBe('Message 24')
    })

    it('should include default model and temperature', () => {
      const messages: Message[] = [createMessage('Test', 'user', 'session-1')]

      const context = buildChatContext(messages)

      expect(context.model).toBeDefined()
      expect(context.temperature).toBe(0.7)
      expect(context.maxTokens).toBe(1000)
    })
  })

  describe('pruneConversationHistory', () => {
    it('should return all messages if under limit', () => {
      const messages: Message[] = Array.from({ length: 10 }, (_, i) =>
        createMessage(`Message ${i}`, 'user', 'session-1')
      )

      const pruned = pruneConversationHistory(messages, 20)

      expect(pruned).toHaveLength(10)
      expect(pruned).toEqual(messages)
    })

    it('should keep only most recent messages when over limit', () => {
      const messages: Message[] = Array.from({ length: 25 }, (_, i) =>
        createMessage(`Message ${i}`, 'user', 'session-1')
      )

      const pruned = pruneConversationHistory(messages, 10)

      expect(pruned).toHaveLength(10)
      expect(pruned[0].content).toBe('Message 15')
      expect(pruned[9].content).toBe('Message 24')
    })

    it('should use default max of 20 messages', () => {
      const messages: Message[] = Array.from({ length: 30 }, (_, i) =>
        createMessage(`Message ${i}`, 'user', 'session-1')
      )

      const pruned = pruneConversationHistory(messages)

      expect(pruned).toHaveLength(20)
    })
  })

  describe('detectCrisisKeywords', () => {
    it('should detect suicide-related keywords', () => {
      expect(detectCrisisKeywords('I want to kill myself')).toBe(true)
      expect(detectCrisisKeywords('thinking about suicide')).toBe(true)
      expect(detectCrisisKeywords('I want to end my life')).toBe(true)
    })

    it('should detect self-harm keywords', () => {
      expect(detectCrisisKeywords('I want to hurt myself')).toBe(true)
      expect(detectCrisisKeywords('self-harm thoughts')).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(detectCrisisKeywords('I WANT TO KILL MYSELF')).toBe(true)
      expect(detectCrisisKeywords('Suicide thoughts')).toBe(true)
    })

    it('should return false for non-crisis messages', () => {
      expect(detectCrisisKeywords('I am feeling sad today')).toBe(false)
      expect(detectCrisisKeywords('Can you help me with anxiety?')).toBe(false)
      expect(detectCrisisKeywords('Hello, how are you?')).toBe(false)
    })

    it('should handle empty strings', () => {
      expect(detectCrisisKeywords('')).toBe(false)
    })
  })

  describe('getCrisisResponseMessage', () => {
    it('should return a message with emergency resources', () => {
      const message = getCrisisResponseMessage()

      expect(message).toContain('911')
      expect(message).toContain('988')
      expect(message).toContain('741741')
      expect(message).toContain('findahelpline.com')
    })

    it('should be empathetic and supportive', () => {
      const message = getCrisisResponseMessage()

      expect(message.toLowerCase()).toContain('concern')
      expect(message.toLowerCase()).toContain('safety')
      expect(message.toLowerCase()).toContain('help')
    })
  })

  describe('getMentalHealthSystemPrompt', () => {
    it('should return a non-empty system prompt', () => {
      const prompt = getMentalHealthSystemPrompt()

      expect(prompt).toBeTruthy()
      expect(prompt.length).toBeGreaterThan(100)
    })

    it('should include key mental health support guidelines', () => {
      const prompt = getMentalHealthSystemPrompt()

      expect(prompt.toLowerCase()).toContain('empathetic')
      expect(prompt.toLowerCase()).toContain('mental health')
      expect(prompt.toLowerCase()).toContain('support')
    })
  })

  describe('generateChatResponse - Input Validation', () => {
    it('should reject empty messages', async () => {
      const response = await generateChatResponse('', [])

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe(AIChatErrorCode.INVALID_INPUT)
      expect(response.error?.message).toContain('empty')
    })

    it('should reject whitespace-only messages', async () => {
      const response = await generateChatResponse('   ', [])

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe(AIChatErrorCode.INVALID_INPUT)
    })

    it('should accept valid messages', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'I understand how you feel.',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      })

      const response = await generateChatResponse('I am feeling anxious', [])

      expect(response.success).toBe(true)
      expect(response.data).toBeTruthy()
    })
  })

  describe('generateChatResponse - Context Management', () => {
    it('should include conversation history in context', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      })

      const history: Message[] = [
        createMessage('Hello', 'user', 'session-1'),
        createMessage('Hi there!', 'assistant', 'session-1'),
      ]

      await generateChatResponse('How are you?', history)

      expect(mockCreate).toHaveBeenCalled()
      const callArgs = mockCreate.mock.calls[0][0]
      expect(callArgs.messages.length).toBeGreaterThan(2) // system + history + new message
    })

    it('should respect custom temperature option', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      })

      await generateChatResponse('Test', [], { temperature: 0.5 })

      expect(mockCreate).toHaveBeenCalled()
      const callArgs = mockCreate.mock.calls[0][0]
      expect(callArgs.temperature).toBe(0.5)
    })

    it('should respect custom maxTokens option', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      })

      await generateChatResponse('Test', [], { maxTokens: 500 })

      expect(mockCreate).toHaveBeenCalled()
      const callArgs = mockCreate.mock.calls[0][0]
      expect(callArgs.max_tokens).toBe(500)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockCreate.mockRejectedValue({
        code: 'ENOTFOUND',
        message: 'Network error',
      })

      const response = await generateChatResponse('Test message', [])

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe(AIChatErrorCode.NETWORK_ERROR)
      expect(response.error?.retryable).toBe(true)
    })

    it('should handle rate limit errors', async () => {
      mockCreate.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded',
      })

      const response = await generateChatResponse('Test message', [])

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe(AIChatErrorCode.RATE_LIMIT)
      expect(response.error?.retryable).toBe(true)
    })

    it('should handle invalid API key errors', async () => {
      mockCreate.mockRejectedValue({
        status: 401,
        message: 'Invalid API key',
      })

      const response = await generateChatResponse('Test message', [])

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe(AIChatErrorCode.API_KEY_MISSING)
      expect(response.error?.retryable).toBe(false)
    })

    it('should handle invalid request errors', async () => {
      mockCreate.mockRejectedValue({
        status: 400,
        message: 'Invalid request',
      })

      const response = await generateChatResponse('Test message', [])

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe(AIChatErrorCode.INVALID_INPUT)
      expect(response.error?.retryable).toBe(false)
    })

    it('should include metadata in error responses', async () => {
      mockCreate.mockRejectedValue({
        status: 500,
        message: 'Server error',
      })

      const response = await generateChatResponse('Test message', [])

      expect(response.metadata).toBeDefined()
      expect(response.metadata.requestId).toBeTruthy()
      expect(response.metadata.processingTime).toBeGreaterThanOrEqual(0)
      expect(response.metadata.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('Response Formatting', () => {
    it('should extract assistant message from API response', async () => {
      const expectedMessage = 'I understand how you feel. Can you tell me more?'
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: expectedMessage,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      })

      const response = await generateChatResponse('I am feeling sad', [])

      expect(response.success).toBe(true)
      expect(response.data).toBe(expectedMessage)
    })

    it('should provide fallback message when API returns empty content', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 0,
          total_tokens: 10,
        },
      })

      const response = await generateChatResponse('Test', [])

      expect(response.success).toBe(true)
      expect(response.data).toContain('unable to generate')
    })

    it('should include token usage in metadata', async () => {
      mockCreate.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 25,
          total_tokens: 40,
        },
      })

      const response = await generateChatResponse('Test', [])

      expect(response.success).toBe(true)
      expect(response.metadata.tokensUsed).toEqual({
        prompt: 15,
        completion: 25,
        total: 40,
      })
    })
  })
})
