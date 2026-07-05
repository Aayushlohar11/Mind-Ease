/**
 * Trend Chart Component
 * Displays mood trends over time using a line chart
 */

'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { MoodDataPoint } from '@backend/types/mood'

interface TrendChartProps {
  data: MoodDataPoint[]
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No trend data available
      </div>
    )
  }

  // Transform data for recharts
  const chartData = data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    intensity: point.averageIntensity,
    mood: point.mood,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 10]} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-3 border rounded shadow-lg">
                  <p className="font-medium">{payload[0].payload.date}</p>
                  <p className="text-sm text-gray-600">
                    Mood: {payload[0].payload.mood}
                  </p>
                  <p className="text-sm">
                    Intensity: {payload[0].value}/10
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="intensity"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
