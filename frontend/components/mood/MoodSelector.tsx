'use client'

import React, { useState } from 'react'
import { Activity, Check, CircleDot, Gauge, MapPin, Plus, Waves } from 'lucide-react'
import { cn } from '@frontend/lib/utils'
import type { MoodContext, MoodType } from '@backend/types/mood'

interface MoodOption {
  mood: MoodType
  label: string
  code: string
  tone: string
  description: string
}

const moodOptions: MoodOption[] = [
  {
    mood: 'very_happy',
    label: 'Very Happy',
    code: 'VH',
    tone: 'from-emerald-400/70 to-cyan-300/60',
    description: 'bright, connected, uplifted',
  },
  {
    mood: 'happy',
    label: 'Happy',
    code: 'HP',
    tone: 'from-lime-300/70 to-emerald-400/60',
    description: 'positive, open, steady',
  },
  {
    mood: 'calm',
    label: 'Calm',
    code: 'CL',
    tone: 'from-sky-300/70 to-teal-300/60',
    description: 'settled, grounded, clear',
  },
  {
    mood: 'energetic',
    label: 'Energetic',
    code: 'EN',
    tone: 'from-amber-300/70 to-teal-300/60',
    description: 'charged, focused, active',
  },
  {
    mood: 'neutral',
    label: 'Neutral',
    code: 'NT',
    tone: 'from-slate-300/60 to-zinc-400/50',
    description: 'even, quiet, observant',
  },
  {
    mood: 'tired',
    label: 'Tired',
    code: 'TR',
    tone: 'from-violet-300/65 to-slate-400/55',
    description: 'low energy, drained',
  },
  {
    mood: 'anxious',
    label: 'Anxious',
    code: 'AX',
    tone: 'from-yellow-300/70 to-orange-400/55',
    description: 'restless, alert, tense',
  },
  {
    mood: 'stressed',
    label: 'Stressed',
    code: 'ST',
    tone: 'from-orange-400/70 to-red-400/55',
    description: 'pressured, overloaded',
  },
  {
    mood: 'sad',
    label: 'Sad',
    code: 'SD',
    tone: 'from-blue-400/70 to-indigo-400/55',
    description: 'heavy, low, tender',
  },
  {
    mood: 'very_sad',
    label: 'Very Sad',
    code: 'VS',
    tone: 'from-indigo-500/70 to-blue-500/55',
    description: 'deeply low, withdrawn',
  },
]

const triggerSuggestions = ['work', 'sleep', 'family', 'health', 'money', 'social media']
const activitySuggestions = ['walk', 'meditation', 'exercise', 'journaling', 'music', 'therapy']
const physicalStateOptions = ['rested', 'tired', 'hungry', 'sore', 'focused', 'overstimulated']

interface MoodSelectorProps {
  selectedMood?: MoodType
  onMoodSelect: (mood: MoodType) => void
  className?: string
}

export function MoodSelector({ selectedMood, onMoodSelect, className }: MoodSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white/85">Mood signal</h3>
          <p className="text-xs text-white/35 mt-1">Select the state closest to right now.</p>
        </div>
        <div className="h-10 w-10 rounded-xl border border-teal-300/20 bg-teal-400/10 grid place-items-center">
          <Waves className="h-5 w-5 text-teal-200" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {moodOptions.map((option) => {
          const isSelected = selectedMood === option.mood
          return (
            <button
              key={option.mood}
              type="button"
              onClick={() => onMoodSelect(option.mood)}
              className={cn(
                'group min-h-[112px] rounded-xl border p-3 text-left transition-all duration-300 hover:scale-[1.02]',
                isSelected
                  ? 'border-teal-300/35 bg-white/[0.07] shadow-lg shadow-teal-500/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              )}
            >
              <div
                className={cn(
                  'mb-3 h-9 w-9 rounded-lg bg-gradient-to-br grid place-items-center text-xs font-bold text-background',
                  option.tone
                )}
              >
                {isSelected ? <Check className="h-4 w-4" /> : option.code}
              </div>
              <span className="block text-sm font-semibold text-white/85">{option.label}</span>
              <span className="mt-1 block text-[11px] leading-4 text-white/35">
                {option.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface IntensitySelectorProps {
  intensity: number
  onIntensityChange: (intensity: number) => void
  className?: string
}

export function IntensitySelector({
  intensity,
  onIntensityChange,
  className,
}: IntensitySelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-white/85">Intensity</h3>
          <p className="text-xs text-white/35 mt-1">How strongly do you feel it?</p>
        </div>
        <span className="text-xl font-bold px-3 py-1 rounded-lg border border-violet-400/20 bg-violet-500/10 text-violet-200">
          {intensity}/10
        </span>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min="1"
          max="10"
          value={intensity}
          onChange={(event) => onIntensityChange(parseInt(event.target.value, 10))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer mood-range-slider"
          style={{
            background: `linear-gradient(to right, rgba(139,92,246,0.7) 0%, rgba(20,184,166,0.7) ${
              (intensity - 1) * 11.1
            }%, rgba(255,255,255,0.08) ${(intensity - 1) * 11.1}%, rgba(255,255,255,0.08) 100%)`,
          }}
        />

        <div className="flex justify-between text-xs text-white/30">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>
    </div>
  )
}

interface MoodEntryFormProps {
  onSubmit: (data: {
    mood: MoodType
    intensity: number
    note?: string
    triggers?: string[]
    activities?: string[]
    context?: Partial<MoodContext>
  }) => void
  isLoading?: boolean
}

export function MoodEntryForm({ onSubmit, isLoading = false }: MoodEntryFormProps) {
  const [mood, setMood] = useState<MoodType | undefined>()
  const [intensity, setIntensity] = useState(5)
  const [note, setNote] = useState('')
  const [triggers, setTriggers] = useState<string[]>([])
  const [customTrigger, setCustomTrigger] = useState('')
  const [activities, setActivities] = useState<string[]>([])
  const [customActivity, setCustomActivity] = useState('')
  const [location, setLocation] = useState('')
  const [weather, setWeather] = useState('')
  const [socialContext, setSocialContext] = useState<MoodContext['socialContext']>('alone')
  const [physicalState, setPhysicalState] = useState<string[]>([])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!mood) {
      return
    }

    const nextTriggers = addOptionalValue(triggers, customTrigger)
    const nextActivities = addOptionalValue(activities, customActivity)

    onSubmit({
      mood,
      intensity,
      note: note.trim() || undefined,
      triggers: nextTriggers.length > 0 ? nextTriggers : undefined,
      activities: nextActivities.length > 0 ? nextActivities : undefined,
      context: {
        location: location.trim() || undefined,
        weather: weather.trim() || undefined,
        socialContext,
        physicalState: physicalState.length > 0 ? physicalState : undefined,
      },
    })

    setMood(undefined)
    setIntensity(5)
    setNote('')
    setTriggers([])
    setCustomTrigger('')
    setActivities([])
    setCustomActivity('')
    setLocation('')
    setWeather('')
    setSocialContext('alone')
    setPhysicalState([])
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-card/80 p-6 backdrop-blur-sm shadow-lg shadow-black/20">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl border border-teal-300/20 bg-teal-400/10 grid place-items-center">
            <Activity className="h-5 w-5 text-teal-200" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">New Check-In</h2>
            <p className="text-sm text-muted-foreground">
              Log mood, context, and what influenced it.
            </p>
          </div>
        </div>

        <MoodSelector selectedMood={mood} onMoodSelect={setMood} />
        <IntensitySelector intensity={intensity} onIntensityChange={setIntensity} />

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/50">Notes</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What is driving this mood?"
            rows={3}
            className={glassInputClass}
          />
        </div>

        <ChipField
          title="Triggers"
          suggestions={triggerSuggestions}
          selected={triggers}
          customValue={customTrigger}
          customPlaceholder="Add trigger"
          onCustomChange={setCustomTrigger}
          onToggle={(value) => setTriggers((current) => toggleValue(current, value))}
        />

        <ChipField
          title="Activities"
          suggestions={activitySuggestions}
          selected={activities}
          customValue={customActivity}
          customPlaceholder="Add activity"
          onCustomChange={setCustomActivity}
          onToggle={(value) => setActivities((current) => toggleValue(current, value))}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium text-white/50">
              <MapPin className="h-4 w-4" />
              Location
            </span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Home, office, outside"
              className={glassInputClass}
            />
          </label>
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium text-white/50">
              <CircleDot className="h-4 w-4" />
              Weather
            </span>
            <input
              value={weather}
              onChange={(event) => setWeather(event.target.value)}
              placeholder="Clear, rainy, humid"
              className={glassInputClass}
            />
          </label>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-white/50">Social context</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['alone', 'with_friends', 'with_family', 'at_work'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSocialContext(option)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-medium capitalize transition-colors',
                  socialContext === option
                    ? 'border-teal-300/35 bg-teal-400/10 text-teal-100'
                    : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20'
                )}
              >
                {option.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <ChipField
          title="Physical state"
          suggestions={physicalStateOptions}
          selected={physicalState}
          onToggle={(value) => setPhysicalState((current) => toggleValue(current, value))}
        />

        <button
          type="submit"
          disabled={!mood || isLoading}
          className="w-full rounded-xl border py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          style={{
            background: mood
              ? 'linear-gradient(135deg, rgba(20,184,166,0.42) 0%, rgba(139,92,246,0.42) 100%)'
              : 'rgba(255,255,255,0.06)',
            borderColor: mood ? 'rgba(45,212,191,0.35)' : 'rgba(255,255,255,0.08)',
            color: mood ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.3)',
          }}
        >
          {isLoading ? 'Saving check-in...' : 'Save Mood Check-In'}
        </button>
      </form>
    </div>
  )
}

function ChipField({
  title,
  suggestions,
  selected,
  customValue,
  customPlaceholder,
  onCustomChange,
  onToggle,
}: {
  title: string
  suggestions: string[]
  selected: string[]
  customValue?: string
  customPlaceholder?: string
  onCustomChange?: (value: string) => void
  onToggle: (value: string) => void
}) {
  const customSelected = customValue ? selected.includes(customValue.trim().toLowerCase()) : false

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-white/50">{title}</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onToggle(suggestion)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              selected.includes(suggestion)
                ? 'border-teal-300/35 bg-teal-400/10 text-teal-100'
                : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20'
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {onCustomChange && (
        <div className="flex gap-2">
          <input
            value={customValue}
            onChange={(event) => onCustomChange(event.target.value)}
            placeholder={customPlaceholder}
            className={glassInputClass}
          />
          <button
            type="button"
            onClick={() => {
              const value = customValue?.trim().toLowerCase()
              if (value) {
                onToggle(value)
                onCustomChange('')
              }
            }}
            className={cn(
              'h-11 w-11 shrink-0 rounded-xl border grid place-items-center transition-colors',
              customSelected
                ? 'border-teal-300/35 bg-teal-400/10 text-teal-100'
                : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20'
            )}
            aria-label={`Add ${title.toLowerCase()}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function toggleValue(values: string[], value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return values
  }

  return values.includes(normalized)
    ? values.filter((item) => item !== normalized)
    : [...values, normalized]
}

function addOptionalValue(values: string[], value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized || values.includes(normalized)) {
    return values
  }

  return [...values, normalized]
}

const glassInputClass = cn(
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white/85 outline-none backdrop-blur-sm transition-all duration-200 placeholder:text-white/25',
  'focus:border-teal-300/35 focus:ring-1 focus:ring-teal-300/20'
)
