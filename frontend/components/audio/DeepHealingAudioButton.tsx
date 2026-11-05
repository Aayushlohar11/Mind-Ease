'use client'

import { useEffect, useState, useRef } from 'react'
import { Music, Volume2, VolumeX, Pause, Sparkles } from 'lucide-react'
import { getHealingAudio } from '@frontend/lib/healing-audio'

interface DeepHealingAudioButtonProps {
  className?: string
  compact?: boolean
}

export function DeepHealingAudioButton({ className = '', compact = false }: DeepHealingAudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.4)
  const [showVolume, setShowVolume] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = getHealingAudio()
    const unsubscribe = audio.subscribe((playing, currentVol) => {
      setIsPlaying(playing)
      setVolume(currentVol)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowVolume(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const audio = getHealingAudio()
    audio.toggle()
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value)
    setVolume(newVol)
    const audio = getHealingAudio()
    audio.setVolume(newVol)
  }

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      <button
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault()
          setShowVolume(!showVolume)
        }}
        type="button"
        title={isPlaying ? 'Deep Healing Music Playing (432Hz) • Click to pause' : 'Play Deep Healing Music (432Hz)'}
        aria-label="Deep Healing Music (432Hz)"
        className={`group relative flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-300 border ${
          isPlaying
            ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-500/20'
            : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-300'
        } ${className}`}
      >
        {/* Music icon */}
        <div className="relative flex items-center justify-center">
          <Music
            className={`h-3.5 w-3.5 transition-transform duration-300 ${
              isPlaying ? 'text-emerald-300 scale-110' : 'text-muted-foreground group-hover:text-emerald-300'
            }`}
          />
          {isPlaying && (
            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>

        {/* Text and dynamic soundwave */}
        {!compact && (
          <div className="flex items-center gap-1.5">
            <span className="tracking-tight">
              {isPlaying ? '432Hz Healing' : 'Healing Music'}
            </span>
            {isPlaying && (
              <div className="flex items-end gap-0.5 h-3 ml-0.5">
                {[40, 90, 60, 100].map((h, i) => (
                  <span
                    key={i}
                    className="w-0.5 rounded-full bg-emerald-400 animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 150}ms`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Volume trigger icon on right */}
        {isPlaying && (
          <span
            onClick={(e) => {
              e.stopPropagation()
              setShowVolume(!showVolume)
            }}
            className="ml-1 opacity-75 hover:opacity-100 p-0.5 rounded hover:bg-emerald-400/20"
            title="Adjust volume"
          >
            {volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </span>
        )}
      </button>

      {/* Volume slider popover */}
      {showVolume && (
        <div className="absolute top-full mt-2 right-0 z-50 w-48 rounded-xl border border-white/10 bg-background/95 p-3 backdrop-blur-xl shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-emerald-300 font-medium">
              <Sparkles className="h-3 w-3" /> 432Hz Therapy
            </span>
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <VolumeX className="h-3 w-3 text-white/40" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-emerald-400 cursor-pointer h-1.5"
            />
            <Volume2 className="h-3 w-3 text-emerald-300" />
          </div>
        </div>
      )}
    </div>
  )
}

