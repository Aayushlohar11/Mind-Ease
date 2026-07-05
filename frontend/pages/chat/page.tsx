'use client'

/**
 * AI Chat Page
 * Main page for AI-powered mental health support chat — macOS glassmorphism design
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChatContainer } from '@frontend/components/chat/ChatContainer'
import type { Message } from '@backend/types/message'

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)
  const [sessionId] = useState(`session_${Date.now()}`)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const handleSendMessage = async (content: string) => {
    if (!session?.user) return

    setError(null)
    setIsLoading(true)

    // Create user message
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      sessionId,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sent',
    }

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: content,
          sessionId,
          conversationHistory: messages.map((m) => ({
            ...m,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session expired. Please sign in again.')
        }
        throw new Error(data.error || 'Failed to get AI response')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      // Create AI message
      const aiMessage: Message = {
        id: `msg_${Date.now()}_ai`,
        sessionId,
        role: 'assistant',
        content: data.data.response,
        timestamp: new Date(),
        status: 'sent',
        sentiment: data.data.sentiment,
      }

      setUsingFallback(!!data.data.usingFallback)

      // Add AI message to UI
      setMessages((prev) => [...prev, aiMessage])
    } catch (err: any) {
      console.error('Chat error:', err)
      setError(err.message || 'Failed to send message. Please try again.')

      // Mark user message as error
      setMessages((prev) =>
        prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: 'error' as const } : msg))
      )
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-mono text-sm text-muted-foreground">Loading chat…</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background portfolio-grid pt-16 relative overflow-hidden">
      {/* Ambient glow orbs behind the glass — macOS vibrancy effect */}
      <div
        className="pointer-events-none absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-[0.12]"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-20 right-1/4 w-80 h-80 rounded-full opacity-[0.10]"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.8) 0%, transparent 70%)' }}
      />

      {/* Top bar — glass header */}
      <div
        className="relative z-10 px-6 py-4"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <p className="font-mono text-xs text-teal-400 mb-1">01 — Chat</p>
            <h1 className="text-xl font-bold font-[family-name:var(--font-display)]">
              AI Mental Health Support
            </h1>
            <p className="text-sm text-muted-foreground">
              Your MindEase space for emotional support
              {usingFallback && (
                <span className="block text-amber-400/90 text-xs mt-1">
                  Demo mode — add OPENAI_API_KEY in .env.local for full AI
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-[1.02]"
            style={{
              color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Chat area — the main glass container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 min-h-0 relative z-10">
        <div
          className="h-full rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow:
              '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <ChatContainer
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isTyping={isTyping}
            error={error}
            showWelcome={messages.length === 0}
          />
        </div>
      </div>
    </div>
  )
}
