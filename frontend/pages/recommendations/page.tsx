'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  BookOpen,
  Check,
  Clock,
  Compass,
  Filter,
  Headphones,
  Library,
  Play,
  RefreshCcw,
  Search,
  Sparkles,
  Star,
  Target,
  Video,
  X,
} from 'lucide-react'
import type {
  Content,
  ContentCategory,
  ContentType,
  Recommendation,
  RecommendationPreferences,
  UserContentHistory,
} from '@backend/types/recommendation'
import type { MoodType } from '@backend/types/mood'

type ActiveTab = 'recommended' | 'library' | 'saved' | 'completed'
type Notice = { type: 'success' | 'error'; text: string }

const contentTypes: ContentType[] = ['article', 'exercise', 'video', 'audio', 'activity']
const categories: ContentCategory[] = [
  'mindfulness',
  'breathing',
  'meditation',
  'journaling',
  'physical_activity',
  'social_connection',
  'self_care',
  'education',
  'coping_strategies',
  'professional_help',
]
const difficulties: Array<'beginner' | 'intermediate' | 'advanced'> = [
  'beginner',
  'intermediate',
  'advanced',
]
const moods: Array<{ value: MoodType | undefined; label: string }> = [
  { value: undefined, label: 'Auto' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'stressed', label: 'Stressed' },
  { value: 'sad', label: 'Sad' },
  { value: 'tired', label: 'Tired' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'calm', label: 'Calm' },
  { value: 'happy', label: 'Happy' },
]

export default function RecommendationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = session?.user?.id || ''

  const [activeTab, setActiveTab] = useState<ActiveTab>('recommended')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [library, setLibrary] = useState<Content[]>([])
  const [history, setHistory] = useState<UserContentHistory | null>(null)
  const [selectedResource, setSelectedResource] = useState<Content | null>(null)
  const [currentMood, setCurrentMood] = useState<MoodType | undefined>()
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>([])
  const [selectedCategories, setSelectedCategories] = useState<ContentCategory[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    Array<'beginner' | 'intermediate' | 'advanced'>
  >([])
  const [maxDuration, setMaxDuration] = useState(60)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice | null>(null)

  const preferences: RecommendationPreferences = useMemo(
    () => ({
      contentTypes: selectedTypes,
      categories: selectedCategories,
      difficulty: selectedDifficulty,
      maxDuration,
    }),
    [maxDuration, selectedCategories, selectedDifficulty, selectedTypes]
  )

  const loadResources = useCallback(async () => {
    if (!userId) {
      return
    }

    setLoading(true)
    setNotice(null)

    try {
      const params = new URLSearchParams({
        mode: 'library',
        maxDuration: String(maxDuration),
      })

      if (search.trim()) params.set('search', search.trim())
      if (selectedTypes.length) params.set('types', selectedTypes.join(','))
      if (selectedCategories.length) params.set('categories', selectedCategories.join(','))
      if (selectedDifficulty.length) params.set('difficulty', selectedDifficulty.join(','))

      const [recommendationRes, libraryRes, historyRes] = await Promise.all([
        fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            currentMood,
            preferences,
            limit: 6,
            excludeViewed: false,
          }),
        }),
        fetch(`/api/recommendations?${params.toString()}`),
        fetch(`/api/recommendations?mode=history&userId=${encodeURIComponent(userId)}`),
      ])

      const recommendationData = await recommendationRes.json()
      const libraryData = await libraryRes.json()
      const historyData = await historyRes.json()

      if (!recommendationRes.ok)
        throw new Error(recommendationData.error || 'Recommendations failed')
      if (!libraryRes.ok) throw new Error(libraryData.error || 'Library failed')
      if (!historyRes.ok) throw new Error(historyData.error || 'History failed')

      setRecommendations(recommendationData.recommendations || [])
      setLibrary(libraryData.contents || [])
      setHistory(historyData.history || null)
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not load resources.',
      })
    } finally {
      setLoading(false)
    }
  }, [
    currentMood,
    maxDuration,
    preferences,
    search,
    selectedCategories,
    selectedDifficulty,
    selectedTypes,
    userId,
  ])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      loadResources()
    }
  }, [loadResources, router, status])

  const recordInteraction = async (
    content: Content,
    interactionType: 'view' | 'start' | 'complete' | 'bookmark'
  ) => {
    if (!userId) return

    try {
      const response = await fetch('/api/recommendations/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contentId: content.id,
          interactionType,
          metadata: {
            source: activeTab,
            currentMood,
          },
        }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Interaction failed')

      if (interactionType === 'start') {
        setSelectedResource(content)
        setNotice({ type: 'success', text: `${content.title} started.` })
      } else if (interactionType === 'bookmark') {
        setNotice({ type: 'success', text: `${content.title} saved.` })
      } else if (interactionType === 'complete') {
        setNotice({ type: 'success', text: `${content.title} marked complete.` })
      }

      await loadResources()
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not record resource action.',
      })
    }
  }

  const activeItems =
    activeTab === 'library' ? library : recommendations.map((item) => item.content)
  const savedItems = history?.bookmarked || []
  const completedItems = history?.completed || []
  const inProgressItems = history?.inProgress || []

  const visibleItems =
    activeTab === 'saved' ? savedItems : activeTab === 'completed' ? completedItems : activeItems

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-mono text-sm text-muted-foreground">Loading resources...</p>
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
        style={{
          background: 'radial-gradient(circle, rgba(244,114,182,0.75) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <header className="card-portfolio p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl border border-teal-300/25 bg-teal-400/10 grid place-items-center">
                <Compass className="h-8 w-8 text-teal-200" />
              </div>
              <div>
                <p className="font-mono text-xs text-teal-400 mb-1">04 - Resources</p>
                <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
                  Resource Library
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Recommended exercises, articles, and practices connected to your MindEase data.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadResources}
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
            className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
              notice.type === 'success'
                ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                : 'border-red-400/25 bg-red-500/10 text-red-200'
            }`}
          >
            <span className="text-sm font-medium">{notice.text}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss notice">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            icon={Sparkles}
            title="Recommended"
            value={recommendations.length}
            detail="Smart matches"
          />
          <MetricCard
            icon={Library}
            title="Library"
            value={library.length}
            detail="Filtered resources"
          />
          <MetricCard icon={Bookmark} title="Saved" value={savedItems.length} detail="Bookmarked" />
          <MetricCard
            icon={Check}
            title="Completed"
            value={completedItems.length}
            detail="Finished"
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)] gap-6">
          <aside className="space-y-6">
            <div className="card-portfolio p-5">
              <SectionTitle
                icon={Target}
                title="Personalize"
                subtitle="Tune recommendations by mood."
              />
              <div className="mt-5 grid grid-cols-2 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => setCurrentMood(mood.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      currentMood === mood.value
                        ? 'border-teal-300/35 bg-teal-400/10 text-teal-100'
                        : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20'
                    }`}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-portfolio p-5">
              <SectionTitle
                icon={Filter}
                title="Filters"
                subtitle="Search the full backend library."
              />
              <label className="mt-5 block space-y-2">
                <span className="text-sm font-medium text-white/50">Search</span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="breathing, sleep, stress..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-3 text-sm text-white/85 outline-none placeholder:text-white/25 focus:border-teal-300/35"
                  />
                </div>
              </label>

              <FilterGroup
                title="Type"
                values={contentTypes}
                selected={selectedTypes}
                labelFor={(value) => value}
                onToggle={(value) => setSelectedTypes((current) => toggleValue(current, value))}
              />
              <FilterGroup
                title="Difficulty"
                values={difficulties}
                selected={selectedDifficulty}
                labelFor={(value) => value}
                onToggle={(value) =>
                  setSelectedDifficulty((current) => toggleValue(current, value))
                }
              />
              <FilterGroup
                title="Category"
                values={categories}
                selected={selectedCategories}
                labelFor={(value) => value.replace('_', ' ')}
                onToggle={(value) =>
                  setSelectedCategories((current) => toggleValue(current, value))
                }
              />

              <label className="mt-5 block space-y-2">
                <span className="text-sm font-medium text-white/50">
                  Max duration: {maxDuration} min
                </span>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={maxDuration}
                  onChange={(event) => setMaxDuration(Number(event.target.value))}
                  className="w-full accent-teal-400"
                />
              </label>

              <button
                onClick={() => {
                  setSearch('')
                  setSelectedTypes([])
                  setSelectedCategories([])
                  setSelectedDifficulty([])
                  setMaxDuration(60)
                }}
                className="mt-5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06]"
              >
                Clear filters
              </button>
            </div>

            <div className="card-portfolio p-5">
              <SectionTitle
                icon={Play}
                title="In Progress"
                subtitle="Resources you have started."
              />
              <div className="mt-5 space-y-3">
                {inProgressItems.length > 0 ? (
                  inProgressItems.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedResource(item)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-teal-300/30"
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.duration || 5} min</p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Start a resource to build your queue.
                  </p>
                )}
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="card-portfolio p-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {(['recommended', 'library', 'saved', 'completed'] as ActiveTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                      activeTab === tab
                        ? 'bg-teal-400/15 text-teal-100'
                        : 'text-white/45 hover:bg-white/[0.04] hover:text-white/80'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-72 rounded-2xl border border-white/10 bg-white/[0.04] animate-pulse"
                  />
                ))}
              </div>
            ) : visibleItems.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                {visibleItems.map((content) => {
                  const rec = recommendations.find((item) => item.content.id === content.id)
                  return (
                    <ResourceCard
                      key={`${activeTab}-${content.id}`}
                      content={content}
                      reason={rec?.reason}
                      score={rec?.score}
                      onOpen={() => {
                        setSelectedResource(content)
                        recordInteraction(content, 'view')
                      }}
                      onStart={() => recordInteraction(content, 'start')}
                      onBookmark={() => recordInteraction(content, 'bookmark')}
                      onComplete={() => recordInteraction(content, 'complete')}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="card-portfolio p-8 text-center">
                <p className="font-semibold">No resources found</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Adjust filters or refresh recommendations.
                </p>
              </div>
            )}
          </main>
        </section>
      </div>

      {selectedResource && (
        <ResourceDrawer
          content={selectedResource}
          onClose={() => setSelectedResource(null)}
          onBookmark={() => recordInteraction(selectedResource, 'bookmark')}
          onComplete={() => recordInteraction(selectedResource, 'complete')}
        />
      )}
    </div>
  )
}

function ResourceCard({
  content,
  reason,
  score,
  onOpen,
  onStart,
  onBookmark,
  onComplete,
}: {
  content: Content
  reason?: string
  score?: number
  onOpen: () => void
  onStart: () => void
  onBookmark: () => void
  onComplete: () => void
}) {
  const Icon = getContentIcon(content.type)

  return (
    <article className="card-portfolio p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="h-11 w-11 rounded-xl border border-teal-300/20 bg-teal-400/10 grid place-items-center">
          <Icon className="h-5 w-5 text-teal-200" />
        </div>
        {score !== undefined && (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/55">
            {Math.round(score * 100)}% match
          </span>
        )}
      </div>

      <div className="mt-4 flex-1">
        <div className="flex flex-wrap gap-2 mb-3">
          <Tag>{content.type}</Tag>
          <Tag>{content.difficulty}</Tag>
          {content.duration && <Tag>{content.duration} min</Tag>}
        </div>
        <h2 className="text-lg font-semibold leading-tight">{content.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{content.description}</p>
        {reason && (
          <p className="mt-3 rounded-xl border border-teal-300/15 bg-teal-400/10 p-3 text-xs leading-5 text-teal-100/80">
            {reason}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {content.tags.slice(0, 4).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button onClick={onOpen} className="resource-action">
          Open
        </button>
        <button onClick={onStart} className="resource-action">
          Start
        </button>
        <button onClick={onBookmark} className="resource-action">
          Save
        </button>
        <button onClick={onComplete} className="resource-action-primary">
          Complete
        </button>
      </div>
    </article>
  )
}

function ResourceDrawer({
  content,
  onClose,
  onBookmark,
  onComplete,
}: {
  content: Content
  onClose: () => void
  onBookmark: () => void
  onComplete: () => void
}) {
  const Icon = getContentIcon(content.type)

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl border border-teal-300/20 bg-teal-400/10 grid place-items-center">
              <Icon className="h-6 w-6 text-teal-200" />
            </div>
            <div>
              <p className="font-mono text-xs text-teal-400 mb-1">
                {content.category.replace('_', ' ')}
              </p>
              <h2 className="text-2xl font-bold">{content.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{content.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-white/50"
            aria-label="Close resource"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          <DetailMetric icon={Clock} label="Duration" value={`${content.duration || 5} min`} />
          <DetailMetric icon={BarChart3} label="Difficulty" value={content.difficulty} />
          <DetailMetric
            icon={Star}
            label="Rating"
            value={content.metadata.rating ? content.metadata.rating.toFixed(1) : 'New'}
          />
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="font-semibold">Guided session</h3>
          <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
            <li>1. Set aside {content.duration || 5} minutes and remove avoidable distractions.</li>
            <li>2. Follow the practice slowly. Pause whenever your body asks for it.</li>
            <li>3. Mark complete when finished so MindEase can improve future recommendations.</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button onClick={onBookmark} className="resource-action flex-1">
            Save resource
          </button>
          <button onClick={onComplete} className="resource-action-primary flex-1">
            Mark complete
          </button>
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: React.ElementType
  title: string
  value: string | number
  detail: string
}) {
  return (
    <article className="card-portfolio p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
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

function FilterGroup<T extends string>({
  title,
  values,
  selected,
  labelFor,
  onToggle,
}: {
  title: string
  values: T[]
  selected: T[]
  labelFor: (value: T) => string
  onToggle: (value: T) => void
}) {
  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm font-medium text-white/50">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            onClick={() => onToggle(value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              selected.includes(value)
                ? 'border-teal-300/35 bg-teal-400/10 text-teal-100'
                : 'border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20'
            }`}
          >
            {labelFor(value)}
          </button>
        ))}
      </div>
    </div>
  )
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <Icon className="h-4 w-4 text-teal-200" />
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs capitalize text-white/60">
      {children}
    </span>
  )
}

function toggleValue<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function getContentIcon(type: ContentType) {
  switch (type) {
    case 'article':
      return BookOpen
    case 'audio':
      return Headphones
    case 'video':
      return Video
    case 'exercise':
      return Target
    case 'activity':
      return Compass
    default:
      return Library
  }
}
