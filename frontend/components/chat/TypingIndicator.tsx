/**
 * TypingIndicator Component
 * macOS-style glassmorphism typing indicator
 */

'use client'

import React from 'react'
import { cn } from '@frontend/lib/utils'
import { Sparkles } from 'lucide-react'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex w-full mb-4 justify-start', className)}>
      <div className="flex max-w-[80%] gap-3">
        {/* Avatar — glass circle */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(124,58,237,0.5) 100%)',
            boxShadow: '0 2px 12px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          AI
        </div>

        {/* Typing Animation — glass bubble */}
        <div className="flex flex-col gap-1">
          <div
            className="rounded-2xl rounded-tl-md px-4 py-3"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: 'rgba(139,92,246,0.6)', animationDelay: '0ms', animationDuration: '1s' }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: 'rgba(139,92,246,0.6)', animationDelay: '150ms', animationDuration: '1s' }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: 'rgba(139,92,246,0.6)', animationDelay: '300ms', animationDuration: '1s' }}
              />
            </div>
          </div>
          <div className="px-2 text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <Sparkles className="h-3 w-3" style={{ color: 'rgba(139,92,246,0.5)' }} />
            AI is thinking...
          </div>
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator
