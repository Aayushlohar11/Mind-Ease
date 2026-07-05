/**
 * Sentiment Analysis Service
 * Analyzes text sentiment and classifies moods
 */

import Sentiment from 'sentiment'
import type { SentimentScore } from '@backend/types/message'
import type { MoodType, MoodCategory } from '@backend/types/mood'

const sentiment = new Sentiment()

/**
 * Analyze sentiment of a text message
 */
export function analyzeSentiment(text: string): SentimentScore {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      comparative: 0,
      calculation: [],
      tokens: [],
      positive: [],
      negative: [],
    }
  }

  const result = sentiment.analyze(text)

  return {
    score: result.score,
    comparative: result.comparative,
    calculation: result.calculation,
    tokens: result.tokens,
    positive: result.positive,
    negative: result.negative,
  }
}

/**
 * Classify mood based on sentiment score and text content
 */
export function classifyMood(text: string, sentimentScore: number): MoodType {
  const lowerText = text.toLowerCase()

  // Check for specific mood keywords
  if (
    lowerText.includes('anxious') ||
    lowerText.includes('worried') ||
    lowerText.includes('nervous')
  ) {
    return 'anxious'
  }

  if (
    lowerText.includes('stressed') ||
    lowerText.includes('overwhelmed') ||
    lowerText.includes('pressure')
  ) {
    return 'stressed'
  }

  if (lowerText.includes('calm') || lowerText.includes('peaceful') || lowerText.includes('relaxed')) {
    return 'calm'
  }

  if (
    lowerText.includes('energetic') ||
    lowerText.includes('excited') ||
    lowerText.includes('motivated')
  ) {
    return 'energetic'
  }

  if (lowerText.includes('tired') || lowerText.includes('exhausted') || lowerText.includes('drained')) {
    return 'tired'
  }

  // Classify based on sentiment score
  if (sentimentScore >= 3) {
    return 'very_happy'
  } else if (sentimentScore >= 1) {
    return 'happy'
  } else if (sentimentScore <= -3) {
    return 'very_sad'
  } else if (sentimentScore <= -1) {
    return 'sad'
  } else {
    return 'neutral'
  }
}

/**
 * Get mood category from mood type
 */
export function getMoodCategory(mood: MoodType): MoodCategory {
  const positiveModds: MoodType[] = ['very_happy', 'happy', 'calm', 'energetic']
  const negativeModds: MoodType[] = ['very_sad', 'sad', 'tired']
  const anxiousModds: MoodType[] = ['anxious', 'stressed']

  if (positiveModds.includes(mood)) {
    return 'positive'
  } else if (negativeModds.includes(mood)) {
    return 'negative'
  } else if (anxiousModds.includes(mood)) {
    return 'anxious'
  } else {
    return 'neutral'
  }
}

/**
 * Get mood intensity from sentiment score (1-10 scale)
 */
export function getMoodIntensity(sentimentScore: number): number {
  // Map sentiment score (-5 to 5) to intensity (1 to 10)
  // Negative scores map to 1-5, positive scores map to 6-10
  const normalized = Math.max(-5, Math.min(5, sentimentScore))
  const intensity = Math.round(((normalized + 5) / 10) * 9 + 1)
  return Math.max(1, Math.min(10, intensity))
}

/**
 * Analyze message and return complete mood analysis
 */
export function analyzeMood(text: string) {
  const sentimentResult = analyzeSentiment(text)
  const mood = classifyMood(text, sentimentResult.score)
  const category = getMoodCategory(mood)
  const intensity = getMoodIntensity(sentimentResult.score)

  return {
    sentiment: sentimentResult,
    mood,
    category,
    intensity,
  }
}
