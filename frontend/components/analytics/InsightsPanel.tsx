/**
 * Insights Panel Component
 * Displays AI-generated insights and recommendations
 */

'use client'

import type { Insight } from '@backend/types/analytics'
import { Card } from '@frontend/components/ui/card'

interface InsightsPanelProps {
  insights: Insight[]
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return null
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'mood_improvement':
        return '📈'
      case 'mood_decline':
        return '📉'
      case 'pattern_detected':
        return '🔍'
      case 'trigger_identified':
        return '⚠️'
      case 'activity_effective':
        return '✨'
      case 'engagement_change':
        return '📊'
      case 'risk_alert':
        return '🚨'
      default:
        return '💡'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50'
      case 'warning':
        return 'border-yellow-500 bg-yellow-50'
      default:
        return 'border-blue-500 bg-blue-50'
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Insights & Recommendations</h3>
      <div className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 border-l-4 rounded ${getSeverityColor(insight.severity)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getInsightIcon(insight.type)}</span>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{insight.title}</h4>
                <p className="text-sm text-gray-700 mb-3">{insight.description}</p>

                {insight.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600 uppercase">
                      Recommendations:
                    </p>
                    <ul className="text-sm space-y-1">
                      {insight.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  Confidence: {(insight.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
