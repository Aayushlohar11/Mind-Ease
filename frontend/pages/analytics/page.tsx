'use client'

/**
 * Analytics Page
 * Displays comprehensive analytics and insights - macOS glassmorphism theme matching mood page
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { Analytics } from '@backend/types/analytics'
import { BarChart3, TrendingUp, Sparkles, Activity, Clock, Zap, AlertTriangle } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      loadAnalytics()
    }
  }, [status, session, period, router])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session?.user?.id,
          period,
          includeInsights: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-mono text-sm text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  const getMoodEmoji = (mood: string) => {
    const emojiMap: Record<string, string> = {
      very_happy: '😄',
      happy: '😊',
      calm: '😌',
      neutral: '😐',
      tired: '😴',
      anxious: '😰',
      stressed: '😫',
      sad: '😢',
      very_sad: '😭',
      energetic: '⚡',
    }
    return emojiMap[mood] || '😐'
  }

  const getTimeEmoji = (time: string) => {
    const emojiMap: Record<string, string> = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌆',
      night: '🌙',
    }
    return emojiMap[time] || '🕐'
  }

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'rgba(34,197,94,0.8)'
    if (trend === 'declining') return 'rgba(239,68,68,0.8)'
    return 'rgba(156,163,175,0.8)'
  }

  const getTrendBg = (trend: string) => {
    if (trend === 'improving') return 'rgba(34,197,94,0.1)'
    if (trend === 'declining') return 'rgba(239,68,68,0.1)'
    return 'rgba(156,163,175,0.1)'
  }

  const getTrendBorder = (trend: string) => {
    if (trend === 'improving') return 'rgba(34,197,94,0.2)'
    if (trend === 'declining') return 'rgba(239,68,68,0.2)'
    return 'rgba(156,163,175,0.2)'
  }

  return (
    <div className="min-h-screen bg-background portfolio-grid pt-16 relative overflow-hidden">
      {/* Ambient glow orbs - macOS vibrancy */}
      <div
        className="pointer-events-none fixed top-32 left-[15%] w-[500px] h-[500px] rounded-full opacity-[0.10]"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed bottom-20 right-[10%] w-[400px] h-[400px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.8) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed top-[60%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.7) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Header - glass bar */}
        <div
          className="flex justify-between items-center rounded-2xl px-6 py-5"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div>
            <p className="font-mono text-xs text-teal-400 mb-1">03 - Analytics</p>
            <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>
              Analytics & Insights
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Track patterns, identify triggers, and discover insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period selector */}
            <div className="flex gap-2">
              {(['week', 'month', 'quarter'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] capitalize"
                  style={{
                    color: period === p ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                    background: period === p
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.4) 100%)'
                      : 'rgba(255,255,255,0.04)',
                    border: period === p
                      ? '1px solid rgba(139,92,246,0.3)'
                      : '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: period === p
                      ? '0 0 12px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  {p}
                </button>
              ))}
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

        {/* Error message */}
        {error && (
          <div
            className="p-4 rounded-xl flex items-center gap-3"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              color: 'rgba(248,113,113,0.9)',
              boxShadow: '0 4px 16px rgba(239,68,68,0.1)',
            }}
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={loadAnalytics}
              className="ml-auto px-3 py-1 text-xs rounded-lg"
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {analytics && analytics.moodAnalytics && (
          <>
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Entries Card */}
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.4) 100%)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      boxShadow: '0 0 12px rgba(139,92,246,0.2)',
                    }}
                  >
                    <BarChart3 className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.9)' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Total Entries
                  </p>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  {analytics.moodAnalytics.totalEntries}
                </p>
              </div>

              {/* Average Mood Card */}
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.4) 0%, rgba(74,222,128,0.4) 100%)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      boxShadow: '0 0 12px rgba(34,197,94,0.2)',
                    }}
                  >
                    <Sparkles className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.9)' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Average Mood
                  </p>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'rgba(74,222,128,0.95)' }}>
                  {analytics.moodAnalytics.averageMood.toFixed(1)}
                  <span className="text-lg font-normal ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>/10</span>
                </p>
              </div>

              {/* Top Trigger Card */}
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(249,115,22,0.4) 0%, rgba(251,146,60,0.4) 100%)',
                      border: '1px solid rgba(249,115,22,0.3)',
                      boxShadow: '0 0 12px rgba(249,115,22,0.2)',
                    }}
                  >
                    <AlertTriangle className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.9)' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Top Trigger
                  </p>
                </div>
                <p className="text-xl font-bold capitalize truncate" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  {analytics.moodAnalytics.topTriggers[0]?.trigger || 'None'}
                </p>
              </div>

              {/* Best Activity Card */}
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(20,184,166,0.4) 0%, rgba(6,182,212,0.4) 100%)',
                      border: '1px solid rgba(20,184,166,0.3)',
                      boxShadow: '0 0 12px rgba(20,184,166,0.2)',
                    }}
                  >
                    <Zap className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.9)' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Best Activity
                  </p>
                </div>
                <p className="text-xl font-bold capitalize truncate" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  {analytics.moodAnalytics.topActivities[0]?.activity || 'None'}
                </p>
              </div>
            </div>

            {/* Time of Day Distribution */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="flex items-center gap-2.5 px-6 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(192,132,252,0.4) 100%)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    boxShadow: '0 0 8px rgba(168,85,247,0.15)',
                  }}
                >
                  <Clock className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.8)' }} />
                </div>
                <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Mood by Time of Day
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analytics.moodAnalytics.timeOfDayDistribution).map(([time, count]) => (
                    <div
                      key={time}
                      className="p-4 rounded-xl text-center"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="text-4xl mb-2">{getTimeEmoji(time)}</div>
                      <div className="text-sm capitalize mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {time}
                      </div>
                      <div className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Triggers */}
              {analytics.moodAnalytics.topTriggers.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="flex items-center gap-2.5 px-6 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, rgba(249,115,22,0.4) 0%, rgba(251,146,60,0.4) 100%)',
                        border: '1px solid rgba(249,115,22,0.3)',
                        boxShadow: '0 0 8px rgba(249,115,22,0.15)',
                      }}
                    >
                      <AlertTriangle className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.8)' }} />
                    </div>
                    <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      Top Triggers
                    </h2>
                  </div>

                  <div className="p-5">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto glass-scrollbar pr-1">
                      {analytics.moodAnalytics.topTriggers.slice(0, 5).map((trigger) => (
                        <div
                          key={trigger.trigger}
                          className="p-4 rounded-xl"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold capitalize" style={{ color: 'rgba(255,255,255,0.85)' }}>
                              {trigger.trigger}
                            </p>
                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{
                                background: getTrendBg(trigger.trend),
                                border: `1px solid ${getTrendBorder(trigger.trend)}`,
                                color: getTrendColor(trigger.trend),
                              }}
                            >
                              {trigger.trend}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {trigger.frequency} occurrences
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                              Impact: <span style={{ color: 'rgba(249,115,22,0.8)' }}>{trigger.averageImpact.toFixed(1)}/10</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Top Activities */}
              {analytics.moodAnalytics.topActivities.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="flex items-center gap-2.5 px-6 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.4) 0%, rgba(74,222,128,0.4) 100%)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        boxShadow: '0 0 8px rgba(34,197,94,0.15)',
                      }}
                    >
                      <Activity className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.8)' }} />
                    </div>
                    <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      Most Effective Activities
                    </h2>
                  </div>

                  <div className="p-5">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto glass-scrollbar pr-1">
                      {analytics.moodAnalytics.topActivities.slice(0, 5).map((activity) => (
                        <div
                          key={activity.activity}
                          className="p-4 rounded-xl"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold capitalize" style={{ color: 'rgba(255,255,255,0.85)' }}>
                              {activity.activity}
                            </p>
                            <span className="text-sm font-medium" style={{ color: 'rgba(74,222,128,0.9)' }}>
                              {(activity.effectiveness * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className="flex-1 h-2 rounded-full overflow-hidden"
                              style={{ background: 'rgba(255,255,255,0.08)' }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${activity.effectiveness * 100}%`,
                                  background: 'linear-gradient(90deg, rgba(34,197,94,0.6) 0%, rgba(74,222,128,0.8) 100%)',
                                  boxShadow: '0 0 8px rgba(34,197,94,0.4)',
                                }}
                              />
                            </div>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {activity.frequency}x
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Insights Panel */}
            {analytics.insights && analytics.insights.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="flex items-center gap-2.5 px-6 py-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.4) 0%, rgba(96,165,250,0.4) 100%)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      boxShadow: '0 0 8px rgba(59,130,246,0.15)',
                    }}
                  >
                    <TrendingUp className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.8)' }} />
                  </div>
                  <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    AI Insights
                  </h2>
                </div>

                <div className="p-5">
                  <div className="space-y-3">
                    {analytics.insights.map((insight, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-xl"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 mt-0.5"
                            style={{
                              background:
                             insight.type === 'mood_improvement' ||
                             insight.type === 'activity_effective'
                              ? 'rgba(34,197,94,0.2)'
                              : insight.type === 'risk_alert' ||
                                insight.type === 'trigger_identified'
                              ? 'rgba(234,179,8,0.2)'
                              : 'rgba(59,130,246,0.2)',
                              border:insight.type === 'mood_improvement' ||
                              insight.type === 'activity_effective'
                               ? '1px solid rgba(34,197,94,0.3)'
                               : insight.type === 'risk_alert' ||
                               insight.type === 'trigger_identified'
                                ? '1px solid rgba(234,179,8,0.3)'
                              : '1px solid rgba(59,130,246,0.3)',
                            }}
                          >
                            <Sparkles className="h-3.5 w-3.5" style={{
                            color:insight.type === 'mood_improvement' ||
                             insight.type === 'activity_effective'
                            ? 'rgba(74,222,128,0.9)'
                             : insight.type === 'risk_alert' ||
                             insight.type === 'trigger_identified'
                             ? 'rgba(250,204,21,0.9)'
                             : 'rgba(96,165,250,0.9)',
                            }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                              {(insight as any).message || insight.description || insight.title}
                            </p>
                            {((insight as any).recommendation || insight.recommendations?.[0]) && (
                              <p className="text-xs mt-2 italic" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                💡 {(insight as any).recommendation || insight.recommendations?.[0]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {analytics && analytics.moodAnalytics.totalEntries === 0 && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <BarChart3 className="h-10 w-10" style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              No analytics data yet
            </p>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Start tracking your mood to see insights and patterns
            </p>
            <button
              onClick={() => router.push('/mood')}
              className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.5) 100%)',
                border: '1px solid rgba(139,92,246,0.35)',
                color: 'rgba(255,255,255,0.9)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              Track Your Mood
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
