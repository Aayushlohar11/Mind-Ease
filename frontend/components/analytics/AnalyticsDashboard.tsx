/**
 * Analytics Dashboard Component
 * Main dashboard displaying comprehensive analytics and insights
 */

'use client'

import { useState, useEffect } from 'react'
import type { Analytics } from '@backend/types/analytics'
import { Card } from '@frontend/components/ui/card'
import { Button } from '@frontend/components/ui/button'
import { TrendChart } from './TrendChart'
import { InsightsPanel } from './InsightsPanel'
import { StatsCard } from './StatsCard'

interface AnalyticsDashboardProps {
  userId: string
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    loadAnalytics()
  }, [userId, period])

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
          userId,
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-gray-200" />
          ))}
        </div>
        <Card className="h-96 animate-pulse bg-gray-200" />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
        <Card className="p-6">
          <p className="text-red-600">Error: {error || 'No data available'}</p>
          <Button onClick={loadAnalytics} className="mt-4">
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  const { moodAnalytics, insights } = analytics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
        <div className="flex gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('week')}
          >
            Week
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('month')}
          >
            Month
          </Button>
          <Button
            variant={period === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('quarter')}
          >
            Quarter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Entries"
          value={moodAnalytics.totalEntries}
          icon="📊"
          trend={moodAnalytics.totalEntries > 0 ? 'up' : 'neutral'}
        />
        <StatsCard
          title="Average Mood"
          value={moodAnalytics.averageMood.toFixed(1)}
          icon="😊"
          trend={
            moodAnalytics.averageMood > 6
              ? 'up'
              : moodAnalytics.averageMood < 4
                ? 'down'
                : 'neutral'
          }
        />
        <StatsCard
          title="Top Trigger"
          value={moodAnalytics.topTriggers[0]?.trigger || 'None'}
          icon="⚠️"
          trend="neutral"
        />
        <StatsCard
          title="Best Activity"
          value={moodAnalytics.topActivities[0]?.activity || 'None'}
          icon="✨"
          trend="up"
        />
      </div>

      {/* Mood Trend Chart */}
      {moodAnalytics.moodTrends.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mood Trend</h3>
          <TrendChart data={moodAnalytics.moodTrends[0].dataPoints} />
        </Card>
      )}

      {/* Time of Day Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Mood by Time of Day</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(moodAnalytics.timeOfDayDistribution).map(([time, count]) => (
            <div key={time} className="text-center">
              <div className="text-2xl mb-2">
                {time === 'morning'
                  ? '🌅'
                  : time === 'afternoon'
                    ? '☀️'
                    : time === 'evening'
                      ? '🌆'
                      : '🌙'}
              </div>
              <div className="text-sm text-gray-600 capitalize">{time}</div>
              <div className="text-lg font-semibold">{count}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Insights */}
      {insights.length > 0 && <InsightsPanel insights={insights} />}

      {/* Top Triggers */}
      {moodAnalytics.topTriggers.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Triggers</h3>
          <div className="space-y-3">
            {moodAnalytics.topTriggers.slice(0, 5).map((trigger) => (
              <div key={trigger.trigger} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{trigger.trigger}</div>
                  <div className="text-sm text-gray-500">
                    {trigger.frequency} occurrences • Impact: {trigger.averageImpact.toFixed(1)}/10
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    trigger.trend === 'improving'
                      ? 'bg-green-100 text-green-700'
                      : trigger.trend === 'declining'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {trigger.trend}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Activities */}
      {moodAnalytics.topActivities.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Effective Activities</h3>
          <div className="space-y-3">
            {moodAnalytics.topActivities.slice(0, 5).map((activity) => (
              <div key={activity.activity} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{activity.activity}</div>
                  <div className="text-sm text-gray-500">
                    {activity.frequency} times • Effectiveness:{' '}
                    {(activity.effectiveness * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${activity.effectiveness * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
