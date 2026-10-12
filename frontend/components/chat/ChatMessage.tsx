/**
 * ChatMessage Component
 * Displays individual chat messages with macOS-style glass bubbles
 */

'use client'

import React from 'react'
import { cn } from '@frontend/lib/utils'
import type { Message } from '@backend/types/message'
import { format } from 'date-fns'

interface ChatMessageProps {
  message: Message
  isLoading?: boolean
}

export function ChatMessage({ message, isLoading = false }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isSystem = message.role === 'system'

  // Don't render system messages in the UI
  if (isSystem) {
    return null
  }

  return (
    <div
      className={cn(
        'flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={cn('flex max-w-[80%] gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
        {/* Avatar - glass circle */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: isUser
              ? 'linear-gradient(135deg, rgba(59,130,246,0.5) 0%, rgba(37,99,235,0.5) 100%)'
              : 'linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(124,58,237,0.5) 100%)',
            boxShadow: isUser
              ? '0 2px 12px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 2px 12px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {isUser ? 'U' : 'AI'}
        </div>

        {/* Message Content - glass bubble */}
        <div className="flex flex-col gap-1">
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5',
              isUser ? 'rounded-tr-md' : 'rounded-tl-md',
              isLoading && 'animate-pulse'
            )}
            style={
              isUser
                ? {
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.35) 0%, rgba(99,102,241,0.3) 100%)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                  }
                : {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }
            }
          >
            {isLoading ? (
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: 'rgba(255,255,255,0.4)', animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: 'rgba(255,255,255,0.4)', animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: 'rgba(255,255,255,0.4)', animationDelay: '300ms' }}
                />
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-white/85">
                {message.content}
              </p>
            )}
          </div>

          {/* Timestamp and Status */}
          <div
            className={cn(
              'flex items-center gap-2 px-2 text-xs',
              isUser ? 'justify-end' : 'justify-start'
            )}
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <span>{format(new Date(message.timestamp), 'h:mm a')}</span>
            {message.status === 'error' && <span className="text-red-400/80">Failed to send</span>}
            {message.status === 'sending' && <span style={{ color: 'rgba(255,255,255,0.2)' }}>Sending...</span>}
          </div>

          {/* Sentiment Indicator (optional) - glass pill */}
          {message.sentiment && isUser && (
            <div className={cn('px-2 text-xs', isUser ? 'text-right' : 'text-left')}>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full"
                style={{
                  background:
                    message.sentiment.score > 0.3
                      ? 'rgba(34,197,94,0.12)'
                      : message.sentiment.score < -0.3
                        ? 'rgba(239,68,68,0.12)'
                        : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${
                    message.sentiment.score > 0.3
                      ? 'rgba(34,197,94,0.2)'
                      : message.sentiment.score < -0.3
                        ? 'rgba(239,68,68,0.2)'
                        : 'rgba(255,255,255,0.1)'
                  }`,
                  color:
                    message.sentiment.score > 0.3
                      ? 'rgba(74,222,128,0.8)'
                      : message.sentiment.score < -0.3
                        ? 'rgba(248,113,113,0.8)'
                        : 'rgba(255,255,255,0.5)',
                }}
              >
                {message.sentiment.score > 0.3
                  ? '😊'
                  : message.sentiment.score < -0.3
                    ? '😔'
                    : '😐'}
                <span className="text-xs">
                  {message.sentiment.score > 0.3
                    ? 'Positive'
                    : message.sentiment.score < -0.3
                      ? 'Negative'
                      : 'Neutral'}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
