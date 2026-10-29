import { describe, it, expect } from 'vitest'
import {
  analyzeSentiment,
  classifyMood,
  getMoodCategory,
  getMoodIntensity,
  analyzeMood,
} from './sentiment.service'

describe('Sentiment Analysis Service', () => {
  describe('analyzeSentiment', () => {
    it('should return zero scores for empty text', () => {
      const result = analyzeSentiment('')
      expect(result.score).toBe(0)
      expect(result.comparative).toBe(0)
      expect(result.tokens).toEqual([])
    })

    it('should score positive sentences positively', () => {
      const result = analyzeSentiment('I feel wonderful, happy, and optimistic!')
      expect(result.score).toBeGreaterThan(0)
      expect(result.positive.length).toBeGreaterThan(0)
    })

    it('should score negative sentences negatively', () => {
      const result = analyzeSentiment('I feel terrible, hopeless, and miserable.')
      expect(result.score).toBeLessThan(0)
      expect(result.negative.length).toBeGreaterThan(0)
    })
  })

  describe('classifyMood', () => {
    it('should classify anxious keywords as anxious', () => {
      expect(classifyMood('I feel so anxious and worried', -2)).toBe('anxious')
    })

    it('should classify happy based on moderate positive score', () => {
      expect(classifyMood('Things are fine', 1)).toBe('happy')
    })

    it('should classify very_happy based on high positive score', () => {
      expect(classifyMood('I feel great', 4)).toBe('very_happy')
    })

    it('should classify calm keywords as calm', () => {
      expect(classifyMood('I feel very relaxed and peaceful', 1)).toBe('calm')
    })

    it('should classify sad based on negative score', () => {
      expect(classifyMood('Feeling down', -1)).toBe('sad')
    })

    it('should classify very_sad based on strongly negative score', () => {
      expect(classifyMood('Feeling completely defeated', -4)).toBe('very_sad')
    })
  })

  describe('getMoodCategory', () => {
    it('should correctly map positive moods', () => {
      expect(getMoodCategory('happy')).toBe('positive')
      expect(getMoodCategory('calm')).toBe('positive')
      expect(getMoodCategory('energetic')).toBe('positive')
      expect(getMoodCategory('very_happy')).toBe('positive')
    })

    it('should correctly map negative moods', () => {
      expect(getMoodCategory('sad')).toBe('negative')
      expect(getMoodCategory('very_sad')).toBe('negative')
      expect(getMoodCategory('tired')).toBe('negative')
    })

    it('should correctly map anxious moods', () => {
      expect(getMoodCategory('anxious')).toBe('anxious')
      expect(getMoodCategory('stressed')).toBe('anxious')
    })

    it('should correctly map neutral moods', () => {
      expect(getMoodCategory('neutral')).toBe('neutral')
    })
  })

  describe('getMoodIntensity & analyzeMood', () => {
    it('should calculate intensity from score', () => {
      expect(getMoodIntensity(5)).toBeGreaterThanOrEqual(1)
      expect(getMoodIntensity(-5)).toBeGreaterThanOrEqual(1)
    })

    it('should analyze complete mood package', () => {
      const result = analyzeMood('I am feeling so anxious about exams')
      expect(result.mood).toBe('anxious')
      expect(result.category).toBe('anxious')
      expect(result.intensity).toBeGreaterThan(0)
      expect(result.sentiment).toBeDefined()
    })
  })
})
