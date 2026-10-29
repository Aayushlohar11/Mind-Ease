/**
 * Content Recommendation Service
 * Implements content-based filtering and personalized recommendations
 * based on user mood history, preferences, and interactions
 */

import type {
  Content,
  ContentType,
  ContentCategory,
  Recommendation,
  RecommendationRequest,
  RecommendationResponse,
  RecommendationReasoning,
  ReasoningFactor,
  ContentInteraction,
  UserContentHistory,
  ContentFilter,
} from '@shared/types/recommendation'
import type { MoodEntry, MoodType, MoodCategory } from '@shared/types/mood'
import { getMoodEntries, getMoodHistory } from './mood.service'

/**
 * Sample content library
 * In production, this would come from a database
 */
const CONTENT_LIBRARY: Content[] = [
  {
    id: 'content-1',
    title: '5-Minute Box Breathing Exercise',
    description:
      'A scientifically proven 4-4-4-4 breathing technique to deactivate your nervous system and instantly curb panic.',
    type: 'exercise',
    category: 'breathing',
    tags: ['anxiety', 'stress', 'quick', 'beginner-friendly', 'box-breathing'],
    duration: 5,
    difficulty: 'beginner',
    targetMoods: ['anxious', 'stressed', 'tired'],
    targetCategories: ['anxious', 'negative'],
    interactiveType: 'breathing',
    metadata: {
      language: 'en',
      rating: 4.9,
      reviewCount: 2450,
      completionRate: 0.94,
      effectivenessScore: 0.96,
    },
    sections: [
      {
        heading: 'Why Box Breathing Works',
        body: 'Also known as square breathing, this technique is utilized by athletes and Navy SEALs to regain mental clarity under intense pressure. It stimulates the vagus nerve, immediately shifting your body from sympathetic (fight-or-flight) to parasympathetic (rest-and-digest).',
        bulletPoints: [
          'Inhale slowly through your nose for 4 seconds',
          'Gently hold that air in your lungs for 4 seconds',
          'Exhale smoothly through your mouth for 4 seconds',
          'Hold your breath empty for 4 seconds before the next breath',
        ],
      },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'content-2',
    title: 'Guided Ocean Soundscape & Sleep Meditation',
    description:
      'Immersive synthesized ocean swells and ambient delta frequencies to relax your muscles and encourage deep slumber.',
    type: 'audio',
    category: 'meditation',
    tags: ['sleep', 'relaxation', 'evening', 'guided', 'ocean-waves'],
    duration: 15,
    difficulty: 'beginner',
    targetMoods: ['tired', 'anxious', 'stressed'],
    targetCategories: ['negative', 'anxious'],
    interactiveType: 'audio_session',
    audioAmbientType: 'ocean',
    metadata: {
      language: 'en',
      rating: 4.8,
      reviewCount: 2100,
      completionRate: 0.88,
      effectivenessScore: 0.89,
    },
    sections: [
      {
        heading: 'Preparing for Rest',
        body: 'Lie down in a comfortable position, dim your lights, and let the gentle rhythm of ocean surf synchronize with your resting breath. Notice any tension in your jaw, shoulders, and chest, and allow each swell to carry that tension away.',
        bulletPoints: [
          'Use headphones or place your phone nearby',
          'Release tongue from the roof of your mouth',
          'Let thoughts pass without judging or following them',
        ],
      },
    ],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: 'content-3',
    title: 'Understanding Depression: A Compassionate Guide',
    description:
      'An educational breakdown of how depressive episodes operate, common cognitive traps, and actionable steps to take.',
    type: 'article',
    category: 'education',
    tags: ['depression', 'education', 'mental-health', 'coping', 'self-compassion'],
    duration: 10,
    difficulty: 'beginner',
    targetMoods: ['sad', 'tired', 'neutral'],
    targetCategories: ['negative', 'neutral'],
    interactiveType: 'article',
    metadata: {
      language: 'en',
      rating: 4.7,
      reviewCount: 1350,
      completionRate: 0.85,
      effectivenessScore: 0.88,
    },
    sections: [
      {
        heading: '1. What You Are Experiencing Is Not Laziness',
        body: 'Depression often masquerades as apathy, guilt, or exhaustion. It is a biological and psychological response that downregulates motivation circuitry. When everyday tasks feel like wading through wet cement, self-criticism only amplifies the weight.',
        bulletPoints: [
          'Recognize emotional exhaustion without assigning moral blame',
          'Lower the threshold: doing 10% of a task is 100% better than zero',
        ],
      },
      {
        heading: '2. The "Micro-Step" Strategy',
        body: 'Do not aim for a complete life makeover when energy is depleted. Pick one small non-negotiable anchor: drinking a glass of water, opening the window for natural light, or taking two minutes of intentional rest.',
        bulletPoints: [
          'Micro-Step: Get out of bed for 3 minutes without requiring yourself to stay up',
          'Micro-Step: Text a supportive friend one emoji or word without having to explain',
        ],
      },
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'content-4',
    title: 'Gratitude Journaling Practice',
    description:
      'A structured 3-part reflection prompt that shifts neurological focus from scarcity to appreciation.',
    type: 'exercise',
    category: 'journaling',
    tags: ['gratitude', 'positive', 'daily-practice', 'self-reflection', 'cbt'],
    duration: 10,
    difficulty: 'beginner',
    targetMoods: ['neutral', 'happy', 'calm', 'sad'],
    targetCategories: ['neutral', 'positive'],
    interactiveType: 'journaling',
    journalPrompts: [
      'What is one small comfort or pleasant sensory detail you noticed today?',
      'Who is someone whose presence, message, or existence you are thankful for?',
      'What is a strength, choice, or tiny effort you made this week that you appreciate about yourself?',
    ],
    metadata: {
      language: 'en',
      rating: 4.9,
      reviewCount: 2800,
      completionRate: 0.95,
      effectivenessScore: 0.94,
    },
    sections: [
      {
        heading: 'Rewiring the Brain for Positivity',
        body: 'Our minds naturally suffer from a negativity bias, scanning for danger and deficit. Gratitude journaling is intentional counter-weight training that reinforces positive neural pathways when practiced consistently.',
      },
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'content-5',
    title: 'Progressive Muscle Relaxation (PMR)',
    description:
      'Systematically tense and release 7 muscle groups to flush out physical stress hormones.',
    type: 'exercise',
    category: 'mindfulness',
    tags: ['relaxation', 'anxiety', 'physical', 'tension-relief', 'body-scan'],
    duration: 12,
    difficulty: 'intermediate',
    targetMoods: ['anxious', 'stressed', 'tired'],
    targetCategories: ['anxious', 'negative'],
    interactiveType: 'breathing',
    metadata: {
      language: 'en',
      rating: 4.7,
      reviewCount: 1150,
      completionRate: 0.86,
      effectivenessScore: 0.89,
    },
    sections: [
      {
        heading: 'How Physical Release Reverses Mental Strain',
        body: 'Muscles hold chronic micro-tensions that signal distress back to the brain. By purposefully exaggerating tension and noticing the warm wave of release, you teach your body what true rest feels like.',
        bulletPoints: [
          'Clench your fists tightly for 5 seconds, then let go completely',
          'Raise shoulders towards your ears for 5 seconds, then drop them softly',
          'Notice the tingling warmth that replaces tension',
        ],
      },
    ],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'content-6',
    title: 'When to Seek Professional Help & Helplines',
    description:
      'Clear signs that indicate therapy or counseling can assist, and how to reach out confidentially.',
    type: 'article',
    category: 'professional_help',
    tags: ['therapy', 'counseling', 'professional', 'support', 'crisis-lines'],
    duration: 8,
    difficulty: 'beginner',
    targetMoods: ['sad', 'anxious', 'stressed'],
    targetCategories: ['negative', 'anxious'],
    interactiveType: 'article',
    metadata: {
      language: 'en',
      rating: 4.9,
      reviewCount: 1800,
      completionRate: 0.92,
      effectivenessScore: 0.96,
    },
    sections: [
      {
        heading: 'When to Reach Out to a Professional',
        body: 'You do not need to be in active crisis to benefit from therapy. Consider scheduling an intake if: your distress impacts daily sleep, hygiene, or work; self-help coping feels insufficient; or you feel trapped in repetitive pain cycles.',
        bulletPoints: [
          'Persistent hopelessness lasting longer than two weeks',
          'Difficulty managing everyday responsibilities or relationships',
          'Substance use or harmful behaviors to numb difficult feelings',
        ],
      },
      {
        heading: 'Free, Confidential Crisis Resources (Available 24/7)',
        body: 'If you or someone you care about needs urgent support, compassionate listeners are ready right now:',
        bulletPoints: [
          '988 Suicide & Crisis Lifeline (US & Canada): Call or text 988',
          'Crisis Text Line: Text HOME to 741741',
          'The Trevor Project (LGBTQ Youth): Call 1-866-488-7386 or text START to 678-678',
          'International Helplines: Visit befrienders.org or iasp.info/resources/Crisis_Centres',
        ],
      },
    ],
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: 'content-7',
    title: 'Mindful Walking & Grounded Movement',
    description:
      'A 15-minute active mindfulness technique that syncs footsteps with breathing to clear mental clutter.',
    type: 'activity',
    category: 'physical_activity',
    tags: ['walking', 'mindfulness', 'outdoor', 'movement', 'fresh-air'],
    duration: 15,
    difficulty: 'beginner',
    targetMoods: ['tired', 'neutral', 'calm', 'happy'],
    targetCategories: ['neutral', 'positive'],
    interactiveType: 'grounding',
    groundingSteps: [
      'Take 5 normal steps noticing the pressure of your heels contacting the earth.',
      'Soften your gaze and identify 3 distinct colors in your surrounding environment.',
      'Take a deep breath and feel the temperature of the air entering your nostrils.',
      'Roll your shoulders back, loosen your jaw, and let your arms swing naturally.',
    ],
    metadata: {
      language: 'en',
      rating: 4.8,
      reviewCount: 920,
      completionRate: 0.91,
      effectivenessScore: 0.87,
    },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'content-8',
    title: 'Building Authentic Social Connections',
    description:
      'Evidence-based communication strategies for cultivating genuine belonging and easing social isolation.',
    type: 'article',
    category: 'social_connection',
    tags: ['relationships', 'social', 'connection', 'loneliness', 'belonging'],
    duration: 12,
    difficulty: 'intermediate',
    targetMoods: ['sad', 'neutral', 'happy'],
    targetCategories: ['negative', 'neutral'],
    interactiveType: 'article',
    metadata: {
      language: 'en',
      rating: 4.6,
      reviewCount: 840,
      effectivenessScore: 0.81,
    },
    sections: [
      {
        heading: 'Quality Over Quantity',
        body: 'Loneliness is not solved by large crowds; it is soothed by felt mutual understanding. Cultivating one reliable reciprocal friendship is profoundly more protective than maintaining dozens of superficial contacts.',
        bulletPoints: [
          'Practice vulnerability in low-risk doses: share one honest feeling today',
          'Ask open-ended curiosity questions rather than polite small talk',
        ],
      },
    ],
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: 'content-9',
    title: 'Calming Visuals & Rain Soundscape',
    description:
      'Continuous soothing rain sounds and ambient frequencies designed to lower cortisol and sharpen focus.',
    type: 'audio',
    category: 'mindfulness',
    tags: ['visual', 'rain', 'relaxation', 'decompression', 'focus'],
    duration: 15,
    difficulty: 'beginner',
    targetMoods: ['anxious', 'stressed', 'tired'],
    targetCategories: ['anxious', 'negative'],
    interactiveType: 'audio_session',
    audioAmbientType: 'rain',
    metadata: {
      language: 'en',
      rating: 4.9,
      reviewCount: 1720,
      completionRate: 0.93,
      effectivenessScore: 0.92,
    },
    sections: [
      {
        heading: 'Ambient Noise Benefits',
        body: 'Steady pink noise mimics the acoustic envelope of natural environments, masking distracting background spikes and gently settling overactive brain waves.',
      },
    ],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: 'content-10',
    title: 'Evening Digital Detox & Unwind Ritual',
    description:
      'A 20-minute restorative evening routine to disconnect from screens and restore inner peace.',
    type: 'activity',
    category: 'self_care',
    tags: ['self-care', 'evening', 'screen-time', 'rest', 'sleep-hygiene'],
    duration: 20,
    difficulty: 'beginner',
    targetMoods: ['tired', 'stressed', 'calm'],
    targetCategories: ['negative', 'neutral'],
    interactiveType: 'journaling',
    journalPrompts: [
      'What screen activity drained most of your energy today?',
      'What is one physical item (tea, book, bath, stretch) that felt grounding tonight?',
      'What can wait until tomorrow so you can rest peacefully now?',
    ],
    metadata: {
      language: 'en',
      rating: 4.8,
      reviewCount: 1150,
      completionRate: 0.89,
      effectivenessScore: 0.9,
    },
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'content-11',
    title: '5-4-3-2-1 Sensory Grounding Technique',
    description:
      'An interactive 5-step sensory anchoring tool to pull your awareness back to the present room during panic.',
    type: 'exercise',
    category: 'coping_strategies',
    tags: ['panic', 'grounding', 'coping', 'immediate-relief', 'sensory'],
    duration: 7,
    difficulty: 'beginner',
    targetMoods: ['anxious', 'stressed'],
    targetCategories: ['anxious'],
    interactiveType: 'grounding',
    groundingSteps: [
      '5 - Look: Name 5 objects you see around you right now (clock, cup, plant...)',
      '4 - Feel: Notice 4 physical textures (chair back, fabric on skin, feet on floor...)',
      '3 - Listen: Identify 3 distinct background sounds (fan, birds, distant traffic...)',
      '2 - Smell: Notice 2 scents around you (fresh air, coffee, clothing...)',
      '1 - Taste: Observe 1 taste lingering in your mouth or take a sip of water.',
    ],
    metadata: {
      language: 'en',
      rating: 4.95,
      reviewCount: 3800,
      completionRate: 0.97,
      effectivenessScore: 0.98,
    },
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: 'content-12',
    title: 'Mastering Emotional Agility: Video Workshop',
    description:
      'An interactive video and conceptual breakdown on observing difficult thoughts without getting hooked by them.',
    type: 'video',
    category: 'education',
    tags: ['video', 'cbt', 'psychology', 'emotional-agility', 'act-therapy'],
    duration: 25,
    difficulty: 'intermediate',
    targetMoods: ['neutral', 'sad', 'stressed', 'calm'],
    targetCategories: ['neutral', 'negative'],
    interactiveType: 'video_player',
    metadata: {
      language: 'en',
      rating: 4.85,
      reviewCount: 1420,
      completionRate: 0.87,
      effectivenessScore: 0.91,
    },
    sections: [
      {
        heading: 'Chapter 1: The Hook',
        body: 'Thoughts like "I cannot handle this" or "Nobody cares" feel like immutable truths. Emotional agility starts with acknowledging: "I am having the thought that I cannot handle this."',
      },
      {
        heading: 'Chapter 2: Values Over Impulses',
        body: 'Courage is not the absence of fear, but taking value-aligned action even while fear is present in the passenger seat.',
      },
    ],
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-02-25'),
  },
]

/**
 * In-memory storage for user interactions
 * In production, this would be in a database
 */
const globalStore = globalThis as typeof globalThis & {
  __mindeaseContentInteractions?: Map<string, ContentInteraction[]>
}

const userInteractions =
  globalStore.__mindeaseContentInteractions ?? new Map<string, ContentInteraction[]>()

globalStore.__mindeaseContentInteractions = userInteractions

/**
 * Generate personalized content recommendations
 */
export async function generateRecommendations(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  const { userId, currentMood, preferences, limit = 6, excludeViewed = false } = request

  // Get user's mood history
  const moodHistory = await getMoodHistory(userId)

  // Get user's content interaction history
  const interactions = getUserInteractions(userId)

  // Filter content based on preferences
  let filteredContent = filterContent(CONTENT_LIBRARY, preferences)

  // Exclude already viewed content if requested
  if (excludeViewed) {
    const viewedIds = new Set(
      interactions.filter((i) => i.interactionType === 'view').map((i) => i.contentId)
    )
    const nonViewed = filteredContent.filter((c) => !viewedIds.has(c.id))
    if (nonViewed.length >= limit) {
      filteredContent = nonViewed
    }
  }

  // Score and rank content
  const scoredContent = filteredContent.map((content) => {
    const { score, reasoning } = scoreContent(content, {
      currentMood,
      moodHistory,
      interactions,
      preferences,
    })

    return {
      content,
      score,
      reasoning,
    }
  })

  // Deduplicate strictly by content.id
  const seenIds = new Set<string>()
  const uniqueScoredContent = scoredContent.filter((item) => {
    if (seenIds.has(item.content.id)) {
      return false
    }
    seenIds.add(item.content.id)
    return true
  })

  // Sort by score descending and take top N
  const topContent = uniqueScoredContent.sort((a, b) => b.score - a.score).slice(0, limit)

  // Create recommendations
  const recommendations: Recommendation[] = topContent.map((item, index) => ({
    id: `rec_${Date.now()}_${index}`,
    userId,
    content: item.content,
    score: item.score,
    reason: generateReasonText(item.reasoning, currentMood),
    reasoning: item.reasoning,
    createdAt: new Date(),
    viewed: false,
    interacted: false,
  }))

  return {
    recommendations,
    totalCount: recommendations.length,
    generatedAt: new Date(),
    refreshIn: 3600, // 1 hour
  }
}

/**
 * Score content based on user context
 */
function scoreContent(
  content: Content,
  context: {
    currentMood?: MoodType
    moodHistory: any
    interactions: ContentInteraction[]
    preferences?: any
  }
): { score: number; reasoning: RecommendationReasoning } {
  const factors: ReasoningFactor[] = []
  let totalScore = 0

  // Factor 1: Mood matching (40% weight)
  if (context.currentMood) {
    const moodMatch = content.targetMoods.includes(context.currentMood) ? 1 : 0
    const categoryMatch = content.targetCategories.includes(
      context.moodHistory.summary?.dominantMood || 'neutral'
    )
      ? 0.5
      : 0
    const moodScore = (moodMatch + categoryMatch) * 0.4
    totalScore += moodScore

    factors.push({
      factor: 'mood_match',
      weight: 0.4,
      contribution: moodScore,
    })
  }

  // Factor 2: Content effectiveness (25% weight)
  const effectivenessScore = (content.metadata.effectivenessScore || 0.5) * 0.25
  totalScore += effectivenessScore

  factors.push({
    factor: 'effectiveness',
    weight: 0.25,
    contribution: effectivenessScore,
  })

  // Factor 3: User preferences (20% weight)
  if (context.preferences) {
    let prefScore = 0
    if (context.preferences.contentTypes?.includes(content.type)) {
      prefScore += 0.5
    }
    if (context.preferences.categories?.includes(content.category)) {
      prefScore += 0.5
    }
    prefScore *= 0.2
    totalScore += prefScore

    factors.push({
      factor: 'preferences',
      weight: 0.2,
      contribution: prefScore,
    })
  }

  // Factor 4: Popularity and rating (10% weight)
  const popularityScore = ((content.metadata.rating || 0) / 5) * 0.1
  totalScore += popularityScore

  factors.push({
    factor: 'popularity',
    weight: 0.1,
    contribution: popularityScore,
  })

  // Factor 5: Completion rate (5% weight)
  const completionScore = (content.metadata.completionRate || 0.5) * 0.05
  totalScore += completionScore

  factors.push({
    factor: 'completion_rate',
    weight: 0.05,
    contribution: completionScore,
  })

  // Calculate confidence based on available data
  const confidence = calculateConfidence(context, factors)

  return {
    score: totalScore,
    reasoning: {
      factors,
      basedOnMood: context.currentMood,
      basedOnPatterns: extractPatterns(context.moodHistory),
      confidence,
    },
  }
}

/**
 * Filter content based on preferences
 */
function filterContent(content: Content[], preferences?: any): Content[] {
  if (!preferences) {
    return content
  }

  return content.filter((item) => {
    // Filter by content types
    if (preferences.contentTypes && preferences.contentTypes.length > 0) {
      if (!preferences.contentTypes.includes(item.type)) {
        return false
      }
    }

    // Filter by categories
    if (preferences.categories && preferences.categories.length > 0) {
      if (!preferences.categories.includes(item.category)) {
        return false
      }
    }

    // Filter by max duration
    if (preferences.maxDuration && item.duration) {
      if (item.duration > preferences.maxDuration) {
        return false
      }
    }

    // Filter by difficulty
    if (preferences.difficulty && preferences.difficulty.length > 0) {
      if (!preferences.difficulty.includes(item.difficulty)) {
        return false
      }
    }

    return true
  })
}

/**
 * Generate human-readable reason text
 */
function generateReasonText(reasoning: RecommendationReasoning, currentMood?: MoodType): string {
  const reasons: string[] = []

  if (reasoning.basedOnMood) {
    reasons.push(`Recommended for your current mood: ${reasoning.basedOnMood}`)
  }

  const topFactor = reasoning.factors.sort((a, b) => b.contribution - a.contribution)[0]
  if (topFactor) {
    if (topFactor.factor === 'effectiveness') {
      reasons.push('Highly effective based on user feedback')
    } else if (topFactor.factor === 'popularity') {
      reasons.push('Popular among other users')
    }
  }

  if (reasoning.confidence > 0.8) {
    reasons.push('Strong match for your needs')
  }

  return reasons.join('. ') || 'Recommended for you'
}

/**
 * Extract patterns from mood history
 */
function extractPatterns(moodHistory: any): string[] {
  const patterns: string[] = []

  if (moodHistory.summary?.dominantMood) {
    patterns.push(`dominant_mood:${moodHistory.summary.dominantMood}`)
  }

  if (moodHistory.summary?.commonTriggers) {
    patterns.push(...moodHistory.summary.commonTriggers.map((t: string) => `trigger:${t}`))
  }

  return patterns
}

/**
 * Calculate confidence score
 */
function calculateConfidence(context: any, factors: ReasoningFactor[]): number {
  let confidence = 0.5 // Base confidence

  // Increase confidence if we have current mood
  if (context.currentMood) {
    confidence += 0.2
  }

  // Increase confidence if we have mood history
  if (context.moodHistory?.entries?.length > 5) {
    confidence += 0.15
  }

  // Increase confidence if we have interaction history
  if (context.interactions?.length > 3) {
    confidence += 0.15
  }

  return Math.min(confidence, 1.0)
}

/**
 * Get user's content interactions
 */
function getUserInteractions(userId: string): ContentInteraction[] {
  return userInteractions.get(userId) || []
}

/**
 * Record a content interaction
 */
export async function recordInteraction(
  userId: string,
  contentId: string,
  interactionType: 'view' | 'start' | 'complete' | 'bookmark' | 'share' | 'rate',
  metadata?: any
): Promise<ContentInteraction> {
  const interaction: ContentInteraction = {
    id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    contentId,
    interactionType,
    timestamp: new Date(),
    completed: interactionType === 'complete',
    metadata,
  }

  const interactions = userInteractions.get(userId) || []
  interactions.push(interaction)
  userInteractions.set(userId, interactions)

  return interaction
}

/**
 * Get content by ID
 */
export function getContentById(contentId: string): Content | null {
  return CONTENT_LIBRARY.find((c) => c.id === contentId) || null
}

/**
 * Get all content with optional filtering
 */
export function getContent(filter?: ContentFilter): Content[] {
  let content = [...CONTENT_LIBRARY]

  if (!filter) {
    return content
  }

  // Apply filters
  if (filter.types && filter.types.length > 0) {
    content = content.filter((c) => filter.types!.includes(c.type))
  }

  if (filter.categories && filter.categories.length > 0) {
    content = content.filter((c) => filter.categories!.includes(c.category))
  }

  if (filter.tags && filter.tags.length > 0) {
    content = content.filter((c) => filter.tags!.some((tag) => c.tags.includes(tag)))
  }

  if (filter.difficulty && filter.difficulty.length > 0) {
    content = content.filter((c) => filter.difficulty!.includes(c.difficulty))
  }

  if (filter.minRating) {
    content = content.filter((c) => (c.metadata.rating || 0) >= filter.minRating!)
  }

  if (filter.maxDuration) {
    content = content.filter((c) => !c.duration || c.duration <= filter.maxDuration!)
  }

  if (filter.search) {
    const searchLower = filter.search.toLowerCase()
    content = content.filter(
      (c) =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    )
  }

  return content
}

/**
 * Get user's content history
 */
export async function getUserContentHistory(userId: string): Promise<UserContentHistory> {
  const interactions = getUserInteractions(userId)

  const bookmarked = interactions
    .filter((i) => i.interactionType === 'bookmark')
    .map((i) => getContentById(i.contentId))
    .filter((c): c is Content => c !== null)

  const completed = interactions
    .filter((i) => i.interactionType === 'complete')
    .map((i) => getContentById(i.contentId))
    .filter((c): c is Content => c !== null)

  const inProgress = interactions
    .filter((i) => i.interactionType === 'start' && !i.completed)
    .map((i) => getContentById(i.contentId))
    .filter((c): c is Content => c !== null)

  return {
    userId,
    interactions,
    bookmarked,
    completed,
    inProgress,
    preferences: {
      contentTypes: [],
      categories: [],
    },
  }
}
