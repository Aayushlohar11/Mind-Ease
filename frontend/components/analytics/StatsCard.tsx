/**
 * Stats Card Component
 * Displays a single statistic with icon and trend
 */

'use client'

import { Card } from '@frontend/components/ui/card'

interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
}

export function StatsCard({ title, value, icon, trend = 'neutral', subtitle }: StatsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗️'
      case 'down':
        return '↘️'
      default:
        return '→'
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-3xl">{icon}</span>
          <span className={`text-sm ${getTrendColor()}`}>{getTrendIcon()}</span>
        </div>
      </div>
    </Card>
  )
}
