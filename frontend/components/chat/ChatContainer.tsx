/**
 * ChatContainer Component
 * Main container for chat interface with macOS-style glassmorphism design
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@frontend/lib/utils'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import type { Message } from '@backend/types/message'
import { AlertCircle, MessageSquare, Sparkles } from 'lucide-react'

interface ChatContainerProps {
  messages: Message[]
  onSendMessage: (message: string) => void | Promise<void>
  isLoading?: boolean
  isTyping?: boolean
  error?: string | null
  className?: string
  showWelcome?: boolean
  welcomeMessage?: string
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading = false,
  isTyping = false,
  error = null,
  className,
  showWelcome = true,
  welcomeMessage = "Hi! I'm here to listen and support you. How are you feeling today?",
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, shouldAutoScroll])

  // Detect if user has scrolled up
  const handleScroll = () => {
    if (!messagesContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

    setShouldAutoScroll(isNearBottom)
  }

  const hasMessages = messages.length > 0
  const displayMessages = messages.filter((msg) => msg.role !== 'system')

  return (
    <div
      className={cn('flex flex-col h-full relative', className)}
      style={{
        background: 'rgba(20, 20, 30, 0.45)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      {/* macOS-style Chat Header - frosted glass bar */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 relative"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(168,85,247,0.5) 100%)',
            boxShadow: '0 0 12px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-white/90 tracking-tight">
            Mental Health Support
          </h2>
          <p className="text-xs text-white/40 font-medium">
            {isTyping ? (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-violet-400 animate-pulse" />
                <span className="text-violet-300/80">AI is typing...</span>
              </span>
            ) : (
              'Always here to listen'
            )}
          </p>
        </div>

        {/* Connection indicator */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(40,200,64,0.1)',
            border: '1px solid rgba(40,200,64,0.2)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-medium text-green-400/80">Active</span>
        </div>
      </div>

      {/* Messages Area - glass scrollable region */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5 space-y-4 glass-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.15) transparent',
        }}
      >
        {/* Welcome Message - macOS-style glass card */}
        {showWelcome && !hasMessages && (
          <div
            className="p-6 rounded-2xl relative overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Subtle gradient glow behind the card */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-15"
              style={{
                background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)',
              }}
            />

            <div className="flex items-start gap-4 relative z-10">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(99,102,241,0.6) 0%, rgba(168,85,247,0.6) 100%)',
                  boxShadow: '0 4px 16px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                AI
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white/90 mb-2">Welcome to MindEase</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-4">{welcomeMessage}</p>
                <div className="space-y-2.5 text-sm text-white/50">
                  <p className="flex items-center gap-2">
                    💙 I&apos;m here to provide emotional support
                  </p>
                  <p className="flex items-center gap-2">
                    🤝 Your conversations are private and secure
                  </p>
                  <p className="flex items-center gap-2">
                    🆘 If you&apos;re in crisis, please reach out to 988 (Suicide & Crisis Lifeline)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message - glass error card */}
        {error && (
          <div
            className="p-4 rounded-xl"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(239,68,68,0.1)',
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-300 mb-1">Error</h4>
                <p className="text-sm text-red-400/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {displayMessages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} disabled={isLoading} />

      {/* Scroll to Bottom Button - glass floating button */}
      {!shouldAutoScroll && (
        <button
          onClick={() => {
            setShouldAutoScroll(true)
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="absolute bottom-24 right-8 p-3 rounded-full transition-all duration-300 hover:scale-105"
          style={{
            background: 'rgba(99,102,241,0.3)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,102,241,0.3)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
          aria-label="Scroll to bottom"
        >
          <svg
            className="w-5 h-5 text-white/90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

export default ChatContainer
