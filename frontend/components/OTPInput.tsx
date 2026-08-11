/**
 * OTP Input Component
 * Beautiful 6-digit OTP input with auto-focus and paste support
 */

'use client'

import { useRef, useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    const digit = newValue.replace(/\D/g, '').slice(-1)
    
    // Update value
    const newOTP = value.split('')
    newOTP[index] = digit
    onChange(newOTP.join(''))

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // If current input is empty, focus previous
        inputRefs.current[index - 1]?.focus()
      } else {
        // Clear current input
        const newOTP = value.split('')
        newOTP[index] = ''
        onChange(newOTP.join(''))
      }
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length)
    onChange(pastedData)

    // Focus the next empty input or last input
    const nextEmptyIndex = pastedData.length < length ? pastedData.length : length - 1
    inputRefs.current[nextEmptyIndex]?.focus()
  }

  const handleFocus = (index: number) => {
    setFocusedIndex(index)
    // Select all text on focus
    inputRefs.current[index]?.select()
  }

  const handleBlur = () => {
    setFocusedIndex(null)
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          disabled={disabled}
          className={`
            w-14 h-16 text-center text-2xl font-bold rounded-xl
            transition-all duration-200 outline-none
            ${
              disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : error
                ? 'bg-red-50 border-2 border-red-500 text-red-600'
                : focusedIndex === index
                ? 'bg-purple-50 border-2 border-purple-500 text-purple-600 shadow-lg shadow-purple-500/20 scale-105'
                : value[index]
                ? 'bg-purple-50 border-2 border-purple-400 text-purple-600'
                : 'bg-white border-2 border-gray-300 text-gray-800 hover:border-purple-300'
            }
          `}
          style={{
            fontFamily: "'Courier New', monospace",
          }}
        />
      ))}
    </div>
  )
}
