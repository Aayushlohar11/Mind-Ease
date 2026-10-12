'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format, subDays } from 'date-fns'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  CircleDot,
  Gauge,
  LineChart,
  RefreshCcw,
  Shield,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { MoodEntryForm } from '@frontend/components/mood/MoodSelector'
import type { MoodEntry, MoodHistory, MoodPattern, MoodTrend, MoodType } from '@backend/types/mood'

type Notice = {
  type: 'success' | 'error'
  text: string
}

type RangeOption = '7d' | '30d' | '90d' | 'all'

const moodMeta: Record<MoodType, { label: string; code: string; color: string }> = {
  very_happy: { label: 'Very Happy', code: 'VH', color: 'rgba(52,211,153,0.85)' },
  happy: { label: 'Happy', code: 'HP', color: 'rgba(132,204,22,0.85)' },
  calm: { label: 'Calm', code: 'CL', color: 'rgba(56,189,248,0.85)' },
  energetic: { label: 'Energetic', code: 'EN', color: 'rgba(251,191,36,0.85)' },
  neutral: { label: 'Neutral', code: 'NT', color: 'rgba(148,163,184,0.85)' },
  tired: { label: 'Tired', code: 'TR', color: 'rgba(167,139,250,0.85)' },
  anxious: { label: 'Anxious', code: 'AX', color: 'rgba(250,204,21,0.85)' },
  stressed: { label: 'Stressed', code: 'ST', color: 'rgba(251,113,133,0.85)' },
  sad: { label: 'Sad', code: 'SD', color: 'rgba(96,165,250,0.85)' },
  very_sad: { label: 'Very Sad', code: 'VS', color: 'rgba(99,102,241,0.85)' },
}

const rangeOptions: Array<{ value: RangeOption; label: string }> = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All' },
]

function getDateRange(range: RangeOption) {
  if (range === 'all') {
    return null
  }

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  return {
    startDate: subDays(new Date(), days).toISOString(),
    endDate: new Date(Date.now() + 1000).toISOString(),
  }
}

export default function MoodPage() {
  const { status } = useSession()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [history, setHistory] = useState<MoodHistory | null>(null)
  const [trend, setTrend] = useState<MoodTrend | null>(null)
  const [patterns, setPatterns] = useState<MoodPattern[]>([])
  const [range, setRange] = useState<RangeOption>('30d')
  const [notice, setNotice] = useState<Notice | null>(null)

  const fetchMoodHistory = useCallback(async () => {
    setIsFetching(true)

    try {
      const dateRange = getDateRange(range)
      const params = new URLSearchParams({
        includeInsights: 'true',
        trendPeriod: range === '90d' || range === 'all' ? 'weekly' : 'daily',
      })

      if (dateRange) {
        params.set('startDate', dateRange.startDate)
        params.set('endDate', dateRange.endDate)
      }

      const response = await fetch(`/api/mood?${params.toString()}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to fetch mood history')
      }

      setHistory(payload.data)
      setTrend(payload.insights?.trend || null)
      setPatterns(payload.insights?.patterns || [])
    } catch (error) {
      console.error('Failed to fetch mood history:', error)
      setNotice({ type: 'error', text: 'Could not load mood history.' })
    } finally {
      setIsFetching(false)
    }
  }, [range])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchMoodHistory()
    }
  }, [fetchMoodHistory, status, router])

  const handleSubmit = async (data: any) => {
    setIsSaving(true)
    setNotice(null)

    try {
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save mood entry')
      }

      setNotice({ type: 'success', text: 'Mood check-in saved.' })
      await fetchMoodHistory()
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save mood entry.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteEntry = async (entryId: string) => {
    setNotice(null)

    try {
      const response = await fetch(`/api/mood?id=${encodeURIComponent(entryId)}`, {
        method: 'DELETE',
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to delete mood entry')
      }

      setNotice({ type: 'success', text: 'Mood check-in deleted.' })
      await fetchMoodHistory()
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not delete mood check-in.',
      })
    }
  }

  const entries = history?.entries || []
  const summary = history?.summary
  const topMoodRows = summary
    ? Object.entries(summary.moodDistribution).sort((a, b) => b[1] - a[1])
    : []
  const maxMoodCount = topMoodRows[0]?.[1] || 1

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-mono text-sm text-muted-foreground">Loading mood workspace...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background portfolio-grid pt-16 relative overflow-hidden">
      <div
        className="pointer-events-none fixed top-28 left-[12%] h-[420px] w-[420px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.8) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed bottom-16 right-[8%] h-[380px] w-[380px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.8) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <header className="card-portfolio p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-2xl border border-teal-300/25 bg-teal-400/10 grid place-items-center overflow-hidden">
                <div className="absolute inset-3 rounded-full border border-white/15" />
                <div className="absolute h-8 w-8 rounded-full border border-teal-200/40" />
                <Activity className="h-7 w-7 text-teal-200" />
              </div>
              <div>
                <p className="font-mono text-xs text-teal-400 mb-1">02 - Mood</p>
                <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
                  Mood Studio
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track signals, context, patterns, and daily emotional momentum.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
                {rangeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRange(option.value)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      range === option.value
                        ? 'bg-teal-400/15 text-teal-100'
                        : 'text-white/45 hover:text-white/80'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchMoodHistory}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.07]"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.07]"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </button>
            </div>
          </div>
        </header>

        {notice && (
          <div
            className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
              notice.type === 'success'
                ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                : 'border-red-400/25 bg-red-500/10 text-red-200'
            }`}
          >
            {notice.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <Shield className="h-4 w-4 shrink-0" />
            )}
            <span className="text-sm font-medium">{notice.text}</span>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Check-ins"
            value={summary?.totalEntries || 0}
            detail={isFetching ? 'Syncing...' : `${range.toUpperCase()} window`}
            icon={CalendarDays}
          />
          <MetricCard
            title="Avg intensity"
            value={summary ? summary.averageIntensity.toFixed(1) : '0.0'}
            detail="1 to 10 scale"
            icon={Gauge}
          />
          <MetricCard
            title="Dominant signal"
            value={summary ? moodMeta[summary.dominantMood].code : 'NT'}
            detail={summary ? moodMeta[summary.dominantMood].label : 'Neutral'}
            icon={CircleDot}
          />
          <MetricCard
            title="Trend"
            value={trend?.direction || 'stable'}
            detail={`${Math.abs(trend?.changeRate || 0).toFixed(1)}% change`}
            icon={TrendingUp}
          />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_440px] gap-6">
          <main className="space-y-6">
            <MoodEntryForm onSubmit={handleSubmit} isLoading={isSaving} />

            <section className="card-portfolio p-6">
              <SectionTitle
                icon={BarChart3}
                title="Mood Distribution"
                subtitle="Backend summary based on the selected date range."
              />
              {topMoodRows.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {topMoodRows.map(([mood, count]) => {
                    const meta = moodMeta[mood as MoodType]
                    return (
                      <div
                        key={mood}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <MoodToken mood={mood as MoodType} />
                            <span className="text-sm font-medium">{meta.label}</span>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(count / maxMoodCount) * 100}%`,
                              background: meta.color,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No distribution yet"
                  text="Save a check-in to start building patterns."
                />
              )}
            </section>

            <section className="grid md:grid-cols-2 gap-4">
              <FactorCard title="Common Triggers" items={summary?.commonTriggers || []} />
              <FactorCard title="Common Activities" items={summary?.commonActivities || []} />
            </section>
          </main>

          <aside className="space-y-6">
            <section className="card-portfolio p-6">
              <SectionTitle
                icon={LineChart}
                title="Backend Insights"
                subtitle="Trend and pattern detection from saved entries."
              />
              <div className="mt-6 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs text-muted-foreground">Trend direction</p>
                  <p className="mt-1 text-lg font-semibold capitalize">
                    {trend?.direction || 'Stable'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {trend?.dataPoints.length || 0} analyzed data point
                    {(trend?.dataPoints.length || 0) === 1 ? '' : 's'}
                  </p>
                </div>

                {patterns.length > 0 ? (
                  patterns.slice(0, 4).map((pattern) => (
                    <div
                      key={`${pattern.type}-${pattern.pattern}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{pattern.pattern}</p>
                          <p className="mt-1 text-xs text-muted-foreground capitalize">
                            {pattern.type.replace('_', ' ')} · {pattern.impact} impact
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/55">
                          {pattern.frequency}x
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="Patterns need more data"
                    text="Add a few entries with triggers or activities."
                  />
                )}
              </div>
            </section>

            <section className="card-portfolio overflow-hidden">
              <div className="border-b border-white/10 px-6 py-4">
                <SectionTitle
                  icon={Activity}
                  title="Recent Check-Ins"
                  subtitle="Stored entries from the mood API."
                />
              </div>
              <div className="p-5">
                {entries.length > 0 ? (
                  <div className="space-y-3 max-h-[680px] overflow-y-auto glass-scrollbar pr-1">
                    {entries.slice(0, 12).map((entry) => (
                      <MoodEntryCard
                        key={entry.id}
                        entry={entry}
                        onDelete={() => deleteEntry(entry.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No check-ins yet"
                    text="Use the form to save your first mood signal."
                  />
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string
  value: string | number
  detail: string
  icon: React.ElementType
}) {
  return (
    <article className="card-portfolio p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold capitalize">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="h-11 w-11 rounded-xl border border-teal-300/20 bg-teal-400/10 grid place-items-center">
          <Icon className="h-5 w-5 text-teal-200" />
        </div>
      </div>
    </article>
  )
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] grid place-items-center">
        <Icon className="h-4 w-4 text-teal-200" />
      </div>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

function MoodEntryCard({ entry, onDelete }: { entry: MoodEntry; onDelete: () => void }) {
  const meta = moodMeta[entry.mood]

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <MoodToken mood={entry.mood} />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{meta.label}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(entry.timestamp), 'MMM d, h:mm a')} · Intensity {entry.intensity}/10
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-white/40 transition-colors hover:border-red-300/30 hover:text-red-200"
          aria-label="Delete mood entry"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {entry.note && <p className="mt-3 text-sm leading-6 text-white/55">{entry.note}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {entry.context?.socialContext && <Tag>{entry.context.socialContext.replace('_', ' ')}</Tag>}
        {entry.context?.location && <Tag>{entry.context.location}</Tag>}
        {entry.context?.weather && <Tag>{entry.context.weather}</Tag>}
        {entry.triggers?.map((trigger) => (
          <Tag key={`trigger-${trigger}`}>{trigger}</Tag>
        ))}
        {entry.activities?.map((activity) => (
          <Tag key={`activity-${activity}`}>{activity}</Tag>
        ))}
      </div>
    </article>
  )
}

function MoodToken({ mood }: { mood: MoodType }) {
  const meta = moodMeta[mood]

  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-xs font-bold text-background"
      style={{
        background: meta.color,
        borderColor: 'rgba(255,255,255,0.16)',
      }}
    >
      {meta.code}
    </span>
  )
}

function FactorCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="card-portfolio p-6">
      <h2 className="font-semibold">{title}</h2>
      {items.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No repeated signals yet.</p>
      )}
    </section>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs capitalize text-white/60">
      {children}
    </span>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
      <p className="text-sm font-medium text-white/70">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  )
}
