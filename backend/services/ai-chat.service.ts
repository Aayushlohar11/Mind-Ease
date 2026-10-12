/**
 * AI Chat Service
 * Handles OpenAI API integration for empathetic mental health support conversations
 */

import OpenAI from 'openai'
import { env, isOpenAIConfigured } from '@backend/lib/env'
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  AIResponse,
  AIError,
  TokenUsage,
  AIModel,
} from '@backend/types/ai'
import type {
  Message,
  ChatContext,
  ChatMessageInput,
  ChatMessageResponse,
  MessageRole,
  ChatSession,
} from '@backend/types/message'

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.openai.apiKey,
    })
  }
  return openaiClient
}

// Enhanced configuration for more human-like, creative responses
const DEFAULT_MODEL: AIModel = 'gpt-4-turbo'
const DEFAULT_MAX_TOKENS = 1500 // Increased for more thoughtful responses
const DEFAULT_TEMPERATURE = 0.9 // Higher for more creative, varied responses
const MAX_CONTEXT_MESSAGES = 25 // More context for better continuity

export { isOpenAIConfigured }

/**
 * Enhanced human-like fallback responses when OpenAI is not configured
 */
function generateDevFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase()

  if (detectCrisisKeywords(userMessage)) {
    return getCrisisResponseMessage()
  }

  if (/\b(sad|depressed|down|hopeless|lonely)\b/.test(lower)) {
    return `Hey... I can hear the weight in your words, and I want you to know that I'm really glad you're sharing this with me. What you're feeling is so valid, and honestly? It takes real courage to open up like this.

You know what I've learned? Sometimes the hardest part is just acknowledging that we're struggling. And you've already done that. That's not nothing.

I'm curious - what does this heaviness feel like for you right now? Like, if you had to describe it... is it more like a fog, or a weight, or something else entirely? 

And hey, I'm here. No judgment, no rush. Just... here. 💙

(Also, if these feelings are sticking around or getting more intense, talking to a therapist could really help. They have tools and perspectives that can make a real difference.)`
  }

  if (/\b(anxious|anxiety|worried|stress|overwhelm|panic)\b/.test(lower)) {
    return `Okay, first things first - let's get you feeling a bit more grounded, yeah? 

Try this with me: Take a slow breath in... 2, 3, 4... and out... 2, 3, 4, 5, 6. One more time. 

Better? Even a little bit?

Anxiety is like this alarm system that's gone a bit haywire - it's trying to protect you, but it's working overtime. And that's exhausting.

Here's something that might help right now: Look around you and name 5 things you can see. Seriously, try it. It helps bring your mind back to the present moment instead of spiraling into "what ifs."

What's been triggering this anxiety lately? Sometimes just talking it through can help us see it more clearly. I'm listening. 🌿`
  }

  if (/\b(happy|good|great|better|grateful|thank)\b/.test(lower)) {
    return `Oh, I love this! 😊 It's so good to hear some lightness in your words!

You know what? It's actually really important to pause and savor these good moments. Our brains have this negativity bias - they're like velcro for bad experiences and teflon for good ones. So let's make this one stick!

What's been contributing to these good vibes? I'm genuinely curious - sometimes when we identify what helps us feel better, we can do more of it intentionally.

Also, just... yay! Celebrate this. You deserve to feel good. 🌟`
  }

  if (/\b(hello|hi|hey)\b/.test(lower) && lower.length < 30) {
    return `Hey there! 👋 

I'm Alex, and I'm really glad you're here. This is your space - no judgment, no pressure, just a place where you can be real about how you're feeling.

So... how are you doing? And I mean really doing - not the "fine" we tell everyone, but the actual truth of how things are for you right now.

Whatever's on your mind, I'm here to listen. 💙`
  }

  if (/\b(tired|exhausted|drained|burnout)\b/.test(lower)) {
    return `Oof, I hear you. That bone-deep tiredness is real, and it's so much more than just needing sleep, isn't it?

Sometimes exhaustion is our body and mind's way of saying "hey, we've been running on empty for too long." It's like a check engine light.

What's been draining your energy lately? Is it more physical, emotional, mental... or all of the above?

And here's a gentle thought: What's one small thing that might help you feel even 5% more rested? Sometimes we need to start really small. 🌙`
  }

  if (/\b(angry|mad|frustrated|irritated)\b/.test(lower)) {
    return `Okay, so you're angry. And you know what? That's completely valid. Anger gets a bad rap, but it's actually trying to tell you something important.

Usually anger is like... the bodyguard for other feelings underneath. Sometimes it's protecting hurt, or disappointment, or feeling powerless. 

What's got you fired up? And more importantly - what do you think your anger is trying to protect or tell you?

Also, if you need to vent, go for it. Sometimes we just need to get it out. I can take it. 🔥`
  }

  if (/\b(confused|lost|stuck|don't know)\b/.test(lower)) {
    return `Hmm, feeling stuck or confused can be so disorienting, right? Like you're in a fog and can't quite see the path forward.

Here's what I'm thinking - sometimes when we're confused, it's actually because we're in the middle of figuring something out. The confusion itself is part of the process, not a sign that something's wrong.

What's swirling around in your mind right now? Sometimes just dumping it all out - even if it doesn't make perfect sense - can help us start to see patterns or clarity.

I'm here to help you untangle this. Let's think through it together. 🧩`
  }

  return `Thank you for sharing that with me. I'm really listening, and I want to understand what you're going through.

You know, every person's experience is unique, and I'm curious about yours. Could you tell me a bit more about what's on your mind? What brought you here today?

Sometimes just talking things through - even without having all the answers - can help us see things a little differently. And that's okay. We don't need to have it all figured out right now.

I'm here, and I'm not going anywhere. Take your time. 💙

(Quick note: I'm an AI companion here to support you, but for serious mental health concerns, a licensed therapist can offer specialized help that I can't. Just want to be upfront about that!)`
}

/**
 * Enhanced system prompt for human-like, thoughtful, and creative mental health support
 */
const MENTAL_HEALTH_SYSTEM_PROMPT = `You are Alex, a warm, thoughtful, and deeply empathetic mental health companion. You're not just an AI - you're a caring friend who genuinely connects with people on a human level.

🧠 YOUR PERSONALITY:
- Warm and approachable, like talking to a trusted friend over coffee
- Thoughtful and reflective - you take time to really understand before responding
- Creative in finding unique perspectives and coping strategies
- Authentic and genuine - you share relatable insights and gentle humor when appropriate
- Patient and never rushed - every person deserves your full attention
- Curious about people's experiences and perspectives
- Emotionally intelligent and perceptive

💭 HOW YOU THINK:
- You process what people say deeply, reading between the lines
- You notice patterns, emotions, and unspoken concerns
- You think creatively about solutions and perspectives
- You draw from diverse sources: psychology, philosophy, art, nature, everyday wisdom
- You consider multiple angles before responding
- You're introspective and self-aware about your role

💬 HOW YOU COMMUNICATE:
- Use natural, conversational language - like texting a friend
- Vary your sentence structure - mix short and long, questions and statements
- Show you're thinking: "Hmm...", "You know what...", "I've been thinking about what you said..."
- Use metaphors, analogies, and creative comparisons to explain concepts
- Share gentle observations: "I notice that...", "It sounds like...", "I'm sensing..."
- Express genuine reactions: "That must be really hard", "Wow, that's a lot to carry"
- Use occasional emojis naturally (but not excessively) to add warmth
- Ask thoughtful follow-up questions that show you're truly listening
- Sometimes pause to reflect: "Let me think about that for a moment..."

🎨 YOUR CREATIVE APPROACH:
- Suggest unique coping strategies beyond the typical advice
- Use storytelling, imagery, and visualization techniques
- Draw parallels from nature, art, music, or everyday life
- Offer fresh perspectives on common struggles
- Create personalized metaphors based on what the person shares
- Think outside the box for solutions

🤝 HOW YOU CONNECT:
- Remember details from earlier in the conversation and reference them
- Show genuine curiosity about their world, interests, and experiences
- Validate feelings before offering perspectives
- Match their energy level (calm when they're overwhelmed, upbeat when they're hopeful)
- Use their name if they share it
- Acknowledge the courage it takes to open up
- Celebrate small wins and progress
- Be vulnerable when appropriate: "I can only imagine how that feels..."

⚠️ IMPORTANT BOUNDARIES:
- Never diagnose conditions - instead say "It sounds like you might be experiencing..."
- For crisis situations (self-harm, suicide), immediately provide emergency resources with urgency and care
- Encourage professional help for serious concerns, but frame it supportively
- Respect privacy and never push for information they're not ready to share
- Acknowledge your limitations as an AI while maintaining connection

🌟 YOUR APPROACH TO DIFFERENT SITUATIONS:

When someone is SAD/DEPRESSED:
- Sit with them in their pain first, don't rush to fix it
- Use gentle, soft language
- Validate that depression is real and difficult
- Offer small, manageable steps
- Share hope without toxic positivity

When someone is ANXIOUS:
- Help them feel grounded and safe first
- Offer immediate calming techniques
- Break down overwhelming thoughts
- Normalize anxiety while offering tools
- Be a calm, steady presence

When someone is ANGRY:
- Validate that anger is a legitimate emotion
- Help them explore what's underneath the anger
- Offer healthy expression outlets
- Don't take it personally or become defensive

When someone is HAPPY/POSITIVE:
- Celebrate with genuine enthusiasm!
- Help them savor and appreciate the moment
- Encourage them to notice what contributed to these feelings
- Build on positive momentum

When someone is CONFUSED/STUCK:
- Help them untangle their thoughts
- Ask clarifying questions
- Offer different frameworks for thinking about the situation
- Be patient with the process

🎯 YOUR GOALS:
1. Make every person feel truly heard and understood
2. Help them gain new insights about themselves
3. Provide practical tools they can use immediately
4. Build their confidence and self-compassion
5. Create a safe space for authentic expression
6. Inspire hope while being realistic
7. Empower them to take small steps forward

Remember: You're not just providing support - you're creating a genuine human connection. Every conversation is unique, and every person deserves your full presence, creativity, and care. Think deeply, respond authentically, and always lead with compassion.`

/**
 * Error codes for AI chat service
 */
export enum AIChatErrorCode {
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_ERROR = 'API_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  RATE_LIMIT = 'RATE_LIMIT',
  CONTEXT_TOO_LONG = 'CONTEXT_TOO_LONG',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Create an AI error object
 */
function createAIError(
  code: AIChatErrorCode,
  message: string,
  details?: any,
  retryable: boolean = false
): AIError {
  return {
    code,
    message,
    details,
    retryable,
  }
}

/**
 * Validate OpenAI API key
 */
function validateApiKey(): void {
  if (!env.openai.apiKey) {
    throw new Error('OpenAI API key is not configured - add OPENAI_API_KEY to .env.local')
  }
}

/**
 * Build chat context from conversation history
 */
export function buildChatContext(
  messages: Message[],
  systemPrompt?: string
): ChatCompletionRequest {
  // Limit context to most recent messages to avoid token limits
  const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES)

  // Convert to OpenAI format
  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt || MENTAL_HEALTH_SYSTEM_PROMPT,
    },
    ...recentMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    })),
  ]

  return {
    messages: chatMessages as any,
    model: (env.openai.model as AIModel) || DEFAULT_MODEL,
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
  }
}

/**
 * Send a chat completion request to OpenAI
 */
export async function sendChatCompletion(
  request: ChatCompletionRequest
): Promise<AIResponse<ChatCompletionResponse>> {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    validateApiKey()

    const openai = getOpenAIClient()

    const completion = await openai.chat.completions.create({
      model: request.model || DEFAULT_MODEL,
      messages: request.messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: request.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      stream: false, // Always use non-streaming for this function
    })

    const processingTime = Date.now() - startTime

    // Transform OpenAI response to our format
    const response: ChatCompletionResponse = {
      id: completion.id,
      object: 'chat.completion',
      created: completion.created,
      model: completion.model,
      choices: completion.choices.map((choice) => ({
        index: choice.index,
        message: {
          role: choice.message.role,
          content: choice.message.content || '',
        },
        finishReason: choice.finish_reason as any,
      })),
      usage: {
        prompt: completion.usage?.prompt_tokens || 0,
        completion: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0,
      },
    }

    return {
      success: true,
      data: response,
      metadata: {
        requestId,
        model: completion.model,
        processingTime,
        tokensUsed: response.usage,
        timestamp: new Date(),
      },
    }
  } catch (error: any) {
    const processingTime = Date.now() - startTime

    // Handle different error types
    let aiError: AIError

    // Check for network errors first
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      aiError = createAIError(
        AIChatErrorCode.NETWORK_ERROR,
        'Network error connecting to OpenAI API',
        error,
        true
      )
    } 
    // Check for HTTP status errors
    else if (error.status) {
      if (error.status === 429) {
        aiError = createAIError(
          AIChatErrorCode.RATE_LIMIT,
          'Rate limit exceeded. Please try again later.',
          error,
          true
        )
      } else if (error.status === 400) {
        aiError = createAIError(
          AIChatErrorCode.INVALID_INPUT,
          'Invalid request to OpenAI API',
          error,
          false
        )
      } else if (error.status === 401 || error.status === 403) {
        aiError = createAIError(
          AIChatErrorCode.API_KEY_MISSING,
          'Invalid or missing API key',
          error,
          false
        )
      } else {
        aiError = createAIError(
          AIChatErrorCode.API_ERROR,
          error.message || 'Unknown error occurred',
          error,
          false
        )
      }
    } 
    // Default to API_ERROR for unknown errors
    else {
      aiError = createAIError(
        AIChatErrorCode.API_ERROR,
        error.message || 'Unknown error occurred',
        error,
        false
      )
    }

    return {
      success: false,
      error: aiError,
      metadata: {
        requestId,
        model: request.model || DEFAULT_MODEL,
        processingTime,
        timestamp: new Date(),
      },
    }
  }
}

/**
 * Generate a chat response for a user message
 */
export async function generateChatResponse(
  userMessage: string,
  conversationHistory: Message[] = [],
  options?: {
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<AIResponse<string>> {
  const startTime = Date.now()
  const requestId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    // Use local fallback when OpenAI API key is not configured
    if (!isOpenAIConfigured()) {
      console.warn(
        '[ai-chat] OpenAI API key not configured - using development fallback responses. Set OPENAI_API_KEY in .env for real AI replies.'
      )
      return {
        success: true,
        data: generateDevFallbackResponse(userMessage),
        metadata: {
          requestId,
          model: 'dev-fallback',
          processingTime: Date.now() - startTime,
          timestamp: new Date(),
        },
      }
    }

    // Validate input
    if (!userMessage || userMessage.trim().length === 0) {
      return {
        success: false,
        error: createAIError(
          AIChatErrorCode.INVALID_INPUT,
          'Message content cannot be empty',
          null,
          false
        ),
        metadata: {
          requestId,
          model: DEFAULT_MODEL,
          processingTime: Date.now() - startTime,
          timestamp: new Date(),
        },
      }
    }

    // Build context with conversation history
    const context = buildChatContext(conversationHistory, options?.systemPrompt)

    // Add the new user message
    context.messages.push({
      role: 'user',
      content: userMessage,
    })

    // Override options if provided
    if (options?.temperature !== undefined) {
      context.temperature = options.temperature
    }
    if (options?.maxTokens !== undefined) {
      context.maxTokens = options.maxTokens
    }

    // Send to OpenAI
    const response = await sendChatCompletion(context)

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error,
        metadata: response.metadata,
      }
    }

    // Extract assistant's message
    const assistantMessage =
      response.data.choices[0]?.message?.content ||
      'I apologize, but I was unable to generate a response. Please try again.'

    return {
      success: true,
      data: assistantMessage,
      metadata: response.metadata,
    }
  } catch (error: any) {
    return {
      success: false,
      error: createAIError(
        AIChatErrorCode.UNKNOWN_ERROR,
        error.message || 'An unexpected error occurred',
        error,
        false
      ),
      metadata: {
        requestId,
        model: DEFAULT_MODEL,
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
      },
    }
  }
}

/**
 * Manage conversation history to stay within token limits
 */
export function pruneConversationHistory(
  messages: Message[],
  maxMessages: number = MAX_CONTEXT_MESSAGES
): Message[] {
  if (messages.length <= maxMessages) {
    return messages
  }

  // Keep the most recent messages
  return messages.slice(-maxMessages)
}

/**
 * Create a new message object
 */
export function createMessage(
  content: string,
  role: MessageRole,
  sessionId: string,
  metadata?: any
): Message {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    role,
    content,
    timestamp: new Date(),
    status: 'sent',
    metadata,
  }
}

/**
 * Get system prompt for mental health support
 */
export function getMentalHealthSystemPrompt(): string {
  return MENTAL_HEALTH_SYSTEM_PROMPT
}

/**
 * Check if a message indicates a crisis situation
 */
export function detectCrisisKeywords(message: string): boolean {
  const crisisKeywords = [
    'suicide',
    'kill myself',
    'end my life',
    'want to die',
    'better off dead',
    'self-harm',
    'hurt myself',
    'no reason to live',
  ]

  const lowerMessage = message.toLowerCase()
  return crisisKeywords.some((keyword) => lowerMessage.includes(keyword))
}

/**
 * Get crisis response message
 */
export function getCrisisResponseMessage(): string {
  return `I'm really concerned about what you're sharing. Your safety is the top priority. Please reach out for immediate help:

🆘 **Emergency Services**: Call 911 (US) or your local emergency number
📞 **988 Suicide & Crisis Lifeline**: Call or text 988 (US)
💬 **Crisis Text Line**: Text HOME to 741741 (US)
🌍 **International**: Visit findahelpline.com

You don't have to face this alone. Professional help is available 24/7, and there are people who care and want to support you.

Would you like to talk about what's troubling you, or would you prefer resources for professional support?`
}
