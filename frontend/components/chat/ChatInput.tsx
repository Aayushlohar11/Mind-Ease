/**
 * ChatInput Component
 * macOS-style glassmorphism input field for sending chat messages
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@frontend/lib/utils'
import { Button } from '@frontend/components/ui/button'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void | Promise<void>
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  className?: string
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 2000,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage || isLoading || disabled) {
      return
    }

    // Clear input immediately for better UX
    setMessage('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Send message
    await onSendMessage(trimmedMessage)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const isMessageValid = message.trim().length > 0 && message.length <= maxLength
  const characterCount = message.length
  const isNearLimit = characterCount > maxLength * 0.8

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-2 p-4', className)}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        className={cn(
          'flex items-end gap-2 p-3 rounded-xl transition-all duration-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          background: isFocused
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(255,255,255,0.04)',
          border: isFocused
            ? '1px solid rgba(139,92,246,0.3)'
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(139,92,246,0.08), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          maxLength={maxLength}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent border-none outline-none text-sm',
            'disabled:cursor-not-allowed',
            'max-h-32 overflow-y-auto'
          )}
          style={{
            color: 'rgba(255,255,255,0.85)',
            caretColor: 'rgba(139,92,246,0.8)',
          }}
          aria-label="Chat message input"
        />

        {/* Send Button - glass orb */}
        <button
          type="submit"
          disabled={!isMessageValid || isLoading || disabled}
          className={cn(
            'flex-shrink-0 h-9 w-9 p-0 rounded-full flex items-center justify-center',
            'transition-all duration-300',
            (!isMessageValid || isLoading) && 'cursor-not-allowed'
          )}
          style={
            isMessageValid && !isLoading
              ? {
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.6) 0%, rgba(139,92,246,0.6) 100%)',
                  border: '1px solid rgba(139,92,246,0.4)',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                }
              : {
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }
          }
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'rgba(255,255,255,0.5)' }} />
          ) : (
            <Send className="h-4 w-4" style={{ color: isMessageValid ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)' }} />
          )}
        </button>
      </div>

      {/* Character Count */}
      {(isNearLimit || characterCount > maxLength) && (
        <div className="flex justify-end px-1">
          <span
            className="text-xs"
            style={{ color: characterCount > maxLength ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.3)' }}
          >
            {characterCount} / {maxLength}
          </span>
        </div>
      )}

      {/* Helper Text */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Press Enter to send, Shift+Enter for new line
        </span>
      </div>
    </form>
  )
}

export default ChatInput
