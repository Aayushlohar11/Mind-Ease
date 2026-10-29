'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Heart,
  Library,
  Pause,
  Phone,
  Play,
  RefreshCcw,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Target,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type {
  Content,
  ContentCategory,
  ContentType,
  Recommendation,
  RecommendationPreferences,
  UserContentHistory,
} from '@shared/types/recommendation'
import type { MoodType } from '@shared/types/mood'

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
  const { data: session } = useSession()
  const router = useRouter()

  const effectiveUserId = useMemo(() => {
    if (session?.user?.id) return session.user.id
    if (session?.user?.email) return session.user.email
    return 'demo-user'
  }, [session])

  const [activeTab, setActiveTab] = useState<ActiveTab>('recommended')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [library, setLibrary] = useState<Content[]>([])
  const [history, setHistory] = useState<UserContentHistory | null>(null)
  const [selectedResource, setSelectedResource] = useState<{
    content: Content
    startInteractive: boolean
  } | null>(null)
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const preferences: RecommendationPreferences = useMemo(
    () => ({
      contentTypes: selectedTypes,
      categories: selectedCategories,
      difficulty: selectedDifficulty,
      maxDuration,
    }),
    [maxDuration, selectedCategories, selectedDifficulty, selectedTypes]
  )

  const appliedFiltersCount = useMemo(() => {
    let count = 0
    if (currentMood) count++
    if (search.trim()) count++
    count += selectedTypes.length
    count += selectedCategories.length
    count += selectedDifficulty.length
    if (maxDuration < 60) count++
    return count
  }, [
    currentMood,
    maxDuration,
    search,
    selectedCategories.length,
    selectedDifficulty.length,
    selectedTypes.length,
  ])

  const loadResources = useCallback(async () => {
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
            userId: effectiveUserId,
            currentMood,
            preferences,
            limit: 6,
            excludeViewed: false,
          }),
        }),
        fetch(`/api/recommendations?${params.toString()}`),
        fetch(`/api/recommendations?mode=history&userId=${encodeURIComponent(effectiveUserId)}`),
      ])

      const recommendationData = await recommendationRes.json()
      const libraryData = await libraryRes.json()
      const historyData = await historyRes.json()

      // Deduplicate recommendations by content.id
      const rawRecs: Recommendation[] = recommendationData.recommendations || []
      const seenIds = new Set<string>()
      const uniqueRecs = rawRecs.filter((item) => {
        if (!item?.content?.id || seenIds.has(item.content.id)) return false
        seenIds.add(item.content.id)
        return true
      })

      setRecommendations(uniqueRecs)
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
    effectiveUserId,
    maxDuration,
    preferences,
    search,
    selectedCategories,
    selectedDifficulty,
    selectedTypes,
  ])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  const recordInteraction = async (
    content: Content,
    interactionType: 'view' | 'start' | 'complete' | 'bookmark'
  ) => {
    try {
      const response = await fetch('/api/recommendations/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
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
        setSelectedResource({ content, startInteractive: true })
        setNotice({ type: 'success', text: `Started: ${content.title}` })
      } else if (interactionType === 'bookmark') {
        setNotice({ type: 'success', text: `Saved to bookmarks: ${content.title}` })
      } else if (interactionType === 'complete') {
        setNotice({ type: 'success', text: `Well done! Completed: ${content.title}` })
      }

      await loadResources()
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not record action.',
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

  return (
    <div className="min-h-screen bg-background portfolio-grid pt-16 sm:pt-20 pb-16 relative overflow-hidden">
      {/* Background radial gradients */}
      <div
        className="pointer-events-none fixed top-24 left-[10%] h-[320px] sm:h-[460px] w-[320px] sm:w-[460px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.8) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed bottom-12 right-[6%] h-[280px] sm:h-[420px] w-[280px] sm:w-[420px] rounded-full opacity-[0.07]"
        style={{
          background: 'radial-gradient(circle, rgba(244,114,182,0.75) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <header className="card-portfolio p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border border-teal-300/25 bg-teal-400/10 grid place-items-center shrink-0">
                <Compass className="h-6 w-6 sm:h-7 sm:w-7 text-teal-200" />
              </div>
              <div>
                <p className="font-mono text-xs text-teal-400">04 - Wellness Hub</p>
                <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold tracking-tight">
                  Resource Library & Practice Hub
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Fully interactive exercises, audio sessions, guided journals, and evidence-based
                  guides.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 sm:self-auto self-end">
              <button
                onClick={loadResources}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs sm:text-sm font-medium text-white/70 transition-all hover:bg-white/[0.08] active:scale-95 disabled:opacity-50"
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs sm:text-sm font-medium text-white/70 transition-all hover:bg-white/[0.08] active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </header>

        {/* Notice alert */}
        {notice && (
          <div
            className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 text-sm animate-in fade-in duration-200 ${
              notice.type === 'success'
                ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                : 'border-red-400/25 bg-red-500/10 text-red-200'
            }`}
          >
            <span className="font-medium">{notice.text}</span>
            <button
              onClick={() => setNotice(null)}
              className="p-1 rounded hover:bg-white/10"
              aria-label="Dismiss notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Metric Cards Banner */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            icon={Sparkles}
            title="Recommended"
            value={recommendations.length}
            detail="Personalized matches"
          />
          <MetricCard
            icon={Library}
            title="Library"
            value={library.length}
            detail="Catalog exercises"
          />
          <MetricCard
            icon={Bookmark}
            title="Saved"
            value={savedItems.length}
            detail="Your bookmarks"
          />
          <MetricCard
            icon={Check}
            title="Completed"
            value={completedItems.length}
            detail="Practices finished"
          />
        </section>

        {/* Mobile Filter Toggle Button (< xl) */}
        <div className="xl:hidden">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="w-full card-portfolio p-3.5 flex items-center justify-between text-sm font-medium transition-colors hover:border-teal-400/30"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-teal-300" />
              <span>Filter & Mood Tuning</span>
              {appliedFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-teal-400/20 text-teal-300 font-mono">
                  {appliedFiltersCount} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{mobileFiltersOpen ? 'Collapse' : 'Expand'}</span>
              {mobileFiltersOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>
        </div>

        {/* Main Content & Sidebar Grid */}
        <section className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
          {/* Sidebar / Filters */}
          <aside className={`space-y-5 ${mobileFiltersOpen ? 'block' : 'hidden xl:block'}`}>
            {/* Mood Tuning */}
            <div className="card-portfolio p-5">
              <SectionTitle
                icon={Target}
                title="Personalize"
                subtitle="Tune recommendations by current state."
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => setCurrentMood(mood.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all min-h-[38px] ${
                      currentMood === mood.value
                        ? 'border-teal-300/40 bg-teal-400/15 text-teal-200 shadow-sm shadow-teal-500/10'
                        : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80'
                    }`}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Group */}
            <div className="card-portfolio p-5 space-y-5">
              <SectionTitle
                icon={Filter}
                title="Filters"
                subtitle="Search and refine content types."
              />

              {/* Search */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-white/60">Search</span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="breathing, sleep, grounding..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white/85 outline-none placeholder:text-white/30 focus:border-teal-300/40"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <FilterGroup
                title="Format"
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

              {/* Duration Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Max Duration</span>
                  <span className="font-mono text-teal-300">{maxDuration} min</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={maxDuration}
                  onChange={(event) => setMaxDuration(Number(event.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              {appliedFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setSearch('')
                    setSelectedTypes([])
                    setSelectedCategories([])
                    setSelectedDifficulty([])
                    setMaxDuration(60)
                    setCurrentMood(undefined)
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* In Progress Quick Queue */}
            {inProgressItems.length > 0 && (
              <div className="card-portfolio p-5">
                <SectionTitle icon={Play} title="In Progress" subtitle="Jump right back in." />
                <div className="mt-4 space-y-2">
                  {inProgressItems.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedResource({ content: item, startInteractive: true })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-teal-300/30 flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <p className="text-xs sm:text-sm font-medium truncate">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.duration || 5} min • {item.type}
                        </p>
                      </div>
                      <Play className="h-3.5 w-3.5 text-teal-300 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Feed */}
          <main className="space-y-6">
            {/* Tabs Bar */}
            <div className="card-portfolio p-1.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['recommended', 'library', 'saved', 'completed'] as ActiveTab[]).map((tab) => {
                  const count =
                    tab === 'recommended'
                      ? recommendations.length
                      : tab === 'library'
                        ? library.length
                        : tab === 'saved'
                          ? savedItems.length
                          : completedItems.length

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold capitalize transition-all min-h-[42px] ${
                        activeTab === tab
                          ? 'bg-teal-400/20 text-teal-100 border border-teal-400/30 shadow-sm shadow-teal-500/10'
                          : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
                      }`}
                    >
                      <span>{tab}</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-md font-mono ${
                          activeTab === tab
                            ? 'bg-teal-400/30 text-teal-200'
                            : 'bg-white/[0.06] text-white/40'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content Cards */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-72 rounded-2xl border border-white/10 bg-white/[0.03] animate-pulse p-5 space-y-4"
                  >
                    <div className="h-10 w-10 rounded-xl bg-white/10" />
                    <div className="h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-full rounded bg-white/5" />
                    <div className="h-3 w-5/6 rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ) : visibleItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                {visibleItems.map((content) => {
                  const rec = recommendations.find((item) => item.content.id === content.id)
                  const isSaved = savedItems.some((s) => s.id === content.id)
                  const isCompleted = completedItems.some((c) => c.id === content.id)

                  return (
                    <ResourceCard
                      key={`${activeTab}-${content.id}`}
                      content={content}
                      reason={rec?.reason}
                      score={rec?.score}
                      isSaved={isSaved}
                      isCompleted={isCompleted}
                      onOpen={() => {
                        setSelectedResource({ content, startInteractive: false })
                        recordInteraction(content, 'view')
                      }}
                      onStart={() => {
                        recordInteraction(content, 'start')
                      }}
                      onBookmark={() => recordInteraction(content, 'bookmark')}
                      onComplete={() => recordInteraction(content, 'complete')}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="card-portfolio p-10 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/10 grid place-items-center mx-auto text-muted-foreground">
                  <Library className="h-6 w-6" />
                </div>
                <p className="font-semibold text-lg">No resources found</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {activeTab === 'saved'
                    ? 'You have not saved any resources yet. Tap "Save" on any card to access it quickly here.'
                    : activeTab === 'completed'
                      ? 'No completed items yet. Complete an interactive practice and mark it finished to build your streak.'
                      : 'Try broadening your search keywords or resetting your category and duration filters.'}
                </p>
                {appliedFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setSearch('')
                      setSelectedTypes([])
                      setSelectedCategories([])
                      setSelectedDifficulty([])
                      setMaxDuration(60)
                      setCurrentMood(undefined)
                    }}
                    className="mt-2 text-xs font-medium text-teal-400 hover:underline"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            )}
          </main>
        </section>
      </div>

      {/* Interactive Resource Detail Drawer / Studio Modal */}
      {selectedResource && (
        <InteractiveResourceModal
          content={selectedResource.content}
          initialInteractive={selectedResource.startInteractive}
          isSaved={savedItems.some((s) => s.id === selectedResource.content.id)}
          isCompleted={completedItems.some((c) => c.id === selectedResource.content.id)}
          onClose={() => setSelectedResource(null)}
          onBookmark={() => recordInteraction(selectedResource.content, 'bookmark')}
          onComplete={() => recordInteraction(selectedResource.content, 'complete')}
        />
      )}
    </div>
  )
}

function ResourceCard({
  content,
  reason,
  score,
  isSaved,
  isCompleted,
  onOpen,
  onStart,
  onBookmark,
  onComplete,
}: {
  content: Content
  reason?: string
  score?: number
  isSaved?: boolean
  isCompleted?: boolean
  onOpen: () => void
  onStart: () => void
  onBookmark: () => void
  onComplete: () => void
}) {
  const Icon = getContentIcon(content.type)

  return (
    <article className="card-portfolio p-4 sm:p-5 h-full flex flex-col justify-between group hover:border-teal-400/40 transition-all duration-300">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="h-11 w-11 rounded-xl border border-teal-300/20 bg-teal-400/10 grid place-items-center shrink-0">
            <Icon className="h-5 w-5 text-teal-200" />
          </div>
          <div className="flex items-center gap-1.5">
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
                <Check className="h-3 w-3" /> Done
              </span>
            )}
            {score !== undefined && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/55 font-mono">
                {Math.round(score * 100)}% match
              </span>
            )}
          </div>
        </div>

        <div className="mt-3.5">
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            <Tag>{content.type}</Tag>
            <Tag>{content.difficulty}</Tag>
            {content.duration && <Tag>{content.duration} min</Tag>}
          </div>
          <h2 className="text-base sm:text-lg font-semibold leading-snug group-hover:text-teal-200 transition-colors">
            {content.title}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {content.description}
          </p>

          {reason && (
            <p className="mt-2.5 rounded-xl border border-teal-300/15 bg-teal-400/10 p-2 text-xs leading-relaxed text-teal-100/80">
              💡 {reason}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {content.tags.slice(0, 3).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
        <button
          onClick={onStart}
          className="w-full rounded-xl border border-teal-400/35 bg-teal-400/15 px-3 py-2.5 text-xs sm:text-sm font-semibold text-teal-100 transition-all hover:bg-teal-400/25 active:scale-[0.98] min-h-[42px] flex items-center justify-center gap-2 shadow-sm shadow-teal-500/10"
        >
          <Play className="h-3.5 w-3.5 fill-teal-200 text-teal-200" />
          <span>Start Interactive Practice</span>
        </button>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={onOpen}
            className="resource-action min-h-[38px] flex items-center justify-center gap-1 text-xs"
          >
            <BookOpen className="h-3 w-3" />
            <span>Guide</span>
          </button>
          <button
            onClick={onBookmark}
            className={`resource-action min-h-[38px] flex items-center justify-center gap-1 text-xs ${
              isSaved ? 'border-teal-400/30 text-teal-200 bg-teal-400/10' : ''
            }`}
          >
            <Bookmark className={`h-3 w-3 ${isSaved ? 'fill-teal-300' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          <button
            onClick={onComplete}
            className={`resource-action min-h-[38px] flex items-center justify-center gap-1 text-xs ${
              isCompleted ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200' : ''
            }`}
          >
            <Check className="h-3 w-3" />
            <span>{isCompleted ? 'Done ✓' : 'Done'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

function InteractiveResourceModal({
  content,
  initialInteractive,
  isSaved,
  isCompleted,
  onClose,
  onBookmark,
  onComplete,
}: {
  content: Content
  initialInteractive: boolean
  isSaved?: boolean
  isCompleted?: boolean
  onClose: () => void
  onBookmark: () => void
  onComplete: () => void
}) {
  const Icon = getContentIcon(content.type)
  const [modalTab, setModalTab] = useState<'practice' | 'guide'>(
    initialInteractive ? 'practice' : 'guide'
  )

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <section className="w-full max-w-2xl max-h-[90vh] sm:max-h-[92vh] overflow-y-auto glass-scrollbar rounded-2xl border border-white/10 bg-card p-5 sm:p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-xl border border-teal-300/20 bg-teal-400/10 grid place-items-center shrink-0">
              <Icon className="h-6 w-6 text-teal-200" />
            </div>
            <div>
              <p className="font-mono text-xs text-teal-400 uppercase tracking-wider mb-0.5">
                {content.category.replace('_', ' ')} • {content.duration || 5} MIN
              </p>
              <h2 className="text-xl sm:text-2xl font-bold leading-tight">{content.title}</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{content.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/60 hover:text-white transition-colors shrink-0"
            aria-label="Close resource"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.04] border border-white/5">
          <button
            onClick={() => setModalTab('practice')}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              modalTab === 'practice'
                ? 'bg-teal-500/20 text-teal-100 border border-teal-500/30 shadow-sm shadow-teal-500/10'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>Interactive Practice</span>
          </button>
          <button
            onClick={() => setModalTab('guide')}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              modalTab === 'guide'
                ? 'bg-teal-500/20 text-teal-100 border border-teal-500/30 shadow-sm shadow-teal-500/10'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Comprehensive Guide</span>
          </button>
        </div>

        {/* Tab 1: Interactive Workspace */}
        {modalTab === 'practice' ? (
          <div className="space-y-4">
            {content.interactiveType === 'breathing' && (
              <BreathingPacer durationMinutes={content.duration || 5} onFinish={onComplete} />
            )}

            {content.interactiveType === 'journaling' && (
              <JournalingStudio
                contentId={content.id}
                title={content.title}
                prompts={
                  content.journalPrompts || [
                    'What feeling or thought is taking up the most space right now?',
                    'What is something you can show compassion to yourself for today?',
                    'What is one peaceful intention for the rest of your day?',
                  ]
                }
                onSaveReflection={onComplete}
              />
            )}

            {content.interactiveType === 'grounding' && (
              <GroundingChecklist
                steps={
                  content.groundingSteps || [
                    '5 - Name 5 things you can visually see in the room.',
                    '4 - Notice 4 distinct physical sensations on your skin or body.',
                    '3 - Listen closely for 3 background sounds.',
                    '2 - Notice 2 scents in the ambient air around you.',
                    '1 - Observe 1 taste or take a calm sip of water.',
                  ]
                }
                onFinish={onComplete}
              />
            )}

            {content.interactiveType === 'audio_session' && (
              <AmbientSoundStudio
                type={content.audioAmbientType || 'ocean'}
                durationMinutes={content.duration || 15}
                title={content.title}
                onFinish={onComplete}
              />
            )}

            {content.interactiveType === 'video_player' && (
              <VideoWorkshopVisualizer title={content.title} onFinish={onComplete} />
            )}

            {(!content.interactiveType || content.interactiveType === 'article') && (
              <div className="rounded-xl border border-teal-400/20 bg-teal-400/5 p-4 space-y-3 text-center">
                <Sparkles className="h-8 w-8 text-teal-300 mx-auto" />
                <h3 className="font-semibold text-sm sm:text-base">Focus & Reflect Mode</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Take a calm moment to read the full guide. When you have absorbed the key
                  principles, mark it complete below to add it to your growth journey.
                </p>
                <button
                  onClick={() => setModalTab('guide')}
                  className="rounded-xl border border-teal-400/30 bg-teal-400/15 px-4 py-2 text-xs font-semibold text-teal-200 hover:bg-teal-400/25"
                >
                  Open Reading Guide →
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Full Guide / Education */
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              <DetailMetric
                icon={Clock}
                label="Estimated Time"
                value={`${content.duration || 5} min`}
              />
              <DetailMetric icon={BarChart3} label="Level" value={content.difficulty} />
              <DetailMetric
                icon={Star}
                label="Effectiveness"
                value={`${Math.round((content.metadata.effectivenessScore || 0.9) * 100)}%`}
              />
            </div>

            {/* Sections */}
            {content.sections && content.sections.length > 0 ? (
              <div className="space-y-4">
                {content.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
                  >
                    <h3 className="font-semibold text-sm sm:text-base text-teal-200">
                      {section.heading}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      {section.body}
                    </p>
                    {section.bulletPoints && section.bulletPoints.length > 0 && (
                      <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-white/80 pl-2">
                        {section.bulletPoints.map((pt, ptIdx) => (
                          <li key={ptIdx} className="flex items-start gap-2">
                            <span className="text-teal-400 text-xs mt-1">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                <h3 className="font-semibold text-sm sm:text-base text-teal-200">
                  Practice Overview
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {content.description}
                </p>
              </div>
            )}

            {/* Crisis Hotline Quick Dialer for Professional Help */}
            {content.category === 'professional_help' && (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
                  <Phone className="h-4 w-4" />
                  <span>Immediate Crisis Support (Free & Confidential 24/7)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <a
                    href="tel:988"
                    className="p-2.5 rounded-lg border border-rose-400/20 bg-rose-400/10 hover:bg-rose-400/20 transition-colors flex items-center justify-between"
                  >
                    <span>988 Suicide & Crisis Lifeline</span>
                    <span className="font-mono font-bold text-rose-200">Dial 988</span>
                  </a>
                  <a
                    href="sms:741741?body=HOME"
                    className="p-2.5 rounded-lg border border-rose-400/20 bg-rose-400/10 hover:bg-rose-400/20 transition-colors flex items-center justify-between"
                  >
                    <span>Crisis Text Line</span>
                    <span className="font-mono font-bold text-rose-200">Text HOME to 741741</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-white/10">
          <button
            onClick={onBookmark}
            className={`resource-action flex-1 min-h-[44px] flex items-center justify-center gap-2 ${
              isSaved ? 'border-teal-400/30 text-teal-200 bg-teal-400/10' : ''
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-teal-300' : ''}`} />
            <span>{isSaved ? 'Saved in Bookmarks' : 'Save to Bookmarks'}</span>
          </button>
          <button
            onClick={onComplete}
            className={`resource-action-primary flex-1 min-h-[44px] flex items-center justify-center gap-2 ${
              isCompleted ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200' : ''
            }`}
          >
            <Check className="h-4 w-4" />
            <span>{isCompleted ? 'Finished ✓' : 'Mark Practice Complete'}</span>
          </button>
        </div>
      </section>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   INTERACTIVE MODULE 1: BOX BREATHING PACER
   ────────────────────────────────────────────────────────────────────────── */
function BreathingPacer({
  durationMinutes,
  onFinish,
}: {
  durationMinutes: number
  onFinish: () => void
}) {
  const [isRunning, setIsRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0) // 0: Inhale, 1: Hold, 2: Exhale, 3: Hold
  const [phaseSeconds, setPhaseSeconds] = useState(4)
  const [cyclesCompleted, setCyclesCompleted] = useState(0)

  const phases = [
    { name: 'Inhale', instruction: 'Breathe in slowly through your nose...', scale: 'scale-125' },
    { name: 'Hold', instruction: 'Gently hold that fresh oxygen...', scale: 'scale-125' },
    { name: 'Exhale', instruction: 'Release smoothly through your mouth...', scale: 'scale-90' },
    { name: 'Rest', instruction: 'Wait gently for the next cycle...', scale: 'scale-90' },
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setPhaseSeconds((prev) => {
          if (prev <= 1) {
            setPhaseIndex((currentPhase) => {
              const nextPhase = (currentPhase + 1) % 4
              if (nextPhase === 0) {
                setCyclesCompleted((c) => c + 1)
              }
              return nextPhase
            })
            return 4
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  return (
    <div className="rounded-2xl border border-teal-400/25 bg-teal-500/[0.04] p-6 text-center space-y-6">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Box Breathing (4-4-4-4)</span>
        <span className="font-mono text-teal-300">Cycles: {cyclesCompleted}</span>
      </div>

      {/* Breathing Bubble */}
      <div className="relative h-44 w-44 mx-auto flex items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500/20 to-cyan-400/20 border-2 border-teal-300/40 blur-sm transition-transform duration-[4000ms] ease-in-out ${
            isRunning ? phases[phaseIndex].scale : 'scale-100'
          }`}
        />
        <div
          className={`h-36 w-36 rounded-full border border-teal-300/50 bg-teal-400/10 backdrop-blur-sm flex flex-col items-center justify-center shadow-lg shadow-teal-500/15 transition-transform duration-[4000ms] ease-in-out ${
            isRunning ? phases[phaseIndex].scale : 'scale-100'
          }`}
        >
          <p className="text-xs uppercase font-mono tracking-widest text-teal-300">
            {isRunning ? phases[phaseIndex].name : 'Ready'}
          </p>
          <p className="text-3xl font-bold font-mono text-white mt-0.5">
            {isRunning ? phaseSeconds : '4s'}
          </p>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-teal-100/90 font-medium min-h-[20px]">
        {isRunning ? phases[phaseIndex].instruction : 'Click Start to begin rhythm breathing.'}
      </p>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="rounded-xl border border-teal-400/40 bg-teal-400/20 px-5 py-2.5 text-xs sm:text-sm font-semibold text-teal-100 hover:bg-teal-400/30 transition-all flex items-center gap-2"
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-teal-100" />}
          <span>{isRunning ? 'Pause' : 'Start Pacer'}</span>
        </button>
        <button
          onClick={() => {
            setIsRunning(false)
            setPhaseIndex(0)
            setPhaseSeconds(4)
            setCyclesCompleted(0)
          }}
          className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-white/60 hover:text-white"
          aria-label="Reset timer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   INTERACTIVE MODULE 2: JOURNALING STUDIO
   ────────────────────────────────────────────────────────────────────────── */
function JournalingStudio({
  contentId,
  title,
  prompts,
  onSaveReflection,
}: {
  contentId: string
  title: string
  prompts: string[]
  onSaveReflection: () => void
}) {
  const storageKey = `mindease_journal_${contentId}`
  const [reflection, setReflection] = useState('')
  const [savedTime, setSavedTime] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setReflection(parsed.text || '')
        setSavedTime(parsed.savedAt || null)
      }
    } catch {
      // Ignore
    }
  }, [storageKey])

  const handleSave = () => {
    if (!reflection.trim()) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    try {
      localStorage.setItem(storageKey, JSON.stringify({ text: reflection, savedAt: now }))
      setSavedTime(now)
      onSaveReflection()
    } catch {
      // Ignore
    }
  }

  return (
    <div className="rounded-2xl border border-teal-400/25 bg-teal-500/[0.04] p-5 space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Guided Journal Reflection</span>
        {savedTime && <span className="text-teal-300 font-mono">Last saved: {savedTime}</span>}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-teal-200 uppercase tracking-wider">
          Inspiration Prompts:
        </p>
        <div className="space-y-1.5">
          {prompts.map((p, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 text-xs text-white/85"
            >
              💡 {p}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-white/60 font-medium">Your Thoughts:</label>
        <textarea
          rows={5}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Write freely without judgment. Your entries remain private on your device..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs sm:text-sm text-white/90 outline-none focus:border-teal-400/40 resize-none glass-scrollbar"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {reflection.trim().split(/\s+/).filter(Boolean).length} words
        </span>
        <button
          onClick={handleSave}
          disabled={!reflection.trim()}
          className="rounded-xl border border-teal-400/40 bg-teal-400/20 px-4 py-2 text-xs font-semibold text-teal-100 hover:bg-teal-400/30 transition-all disabled:opacity-40"
        >
          Save to My Journal ✓
        </button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   INTERACTIVE MODULE 3: 5-4-3-2-1 GROUNDING CHECKLIST
   ────────────────────────────────────────────────────────────────────────── */
function GroundingChecklist({ steps, onFinish }: { steps: string[]; onFinish: () => void }) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      if (next.length === steps.length) {
        onFinish()
      }
      return next
    })
  }

  const allDone = completedSteps.length === steps.length

  return (
    <div className="rounded-2xl border border-teal-400/25 bg-teal-500/[0.04] p-5 space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>5-4-3-2-1 Sensory Grounding</span>
        <span className="font-mono text-teal-300">
          {completedSteps.length} of {steps.length} completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-teal-400 transition-all duration-300"
          style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isDone = completedSteps.includes(idx)
          return (
            <button
              key={idx}
              onClick={() => toggleStep(idx)}
              className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm flex items-start gap-3 transition-all ${
                isDone
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                  isDone
                    ? 'border-emerald-400 bg-emerald-500 text-black'
                    : 'border-white/30 bg-transparent'
                }`}
              >
                {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
              <span className={isDone ? 'line-through opacity-80' : ''}>{step}</span>
            </button>
          )
        })}
      </div>

      {allDone && (
        <div className="p-3 rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-center text-xs text-emerald-200 animate-in fade-in">
          ✨ Excellent job. Notice your feet firmly anchored to the earth right now.
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   INTERACTIVE MODULE 4: WEB AUDIO AMBIENT SOUND GENERATOR (100% RELIABLE)
   ────────────────────────────────────────────────────────────────────────── */
function AmbientSoundStudio({
  type,
  durationMinutes,
  title,
  onFinish,
}: {
  type: 'ocean' | 'rain' | 'forest' | 'binaural'
  durationMinutes: number
  title: string
  onFinish: () => void
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.4)
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const stopAudio = useCallback(() => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop()
        noiseSourceRef.current.disconnect()
      } catch {
        // Ignore
      }
      noiseSourceRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close()
      } catch {
        // Ignore
      }
      audioCtxRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const startAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      // 5-second buffer of soothing filtered pink noise
      const bufferSize = ctx.sampleRate * 5
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.969 * b2 + white * 0.153852
        b3 = 0.8665 * b3 + white * 0.3104856
        b4 = 0.55 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.016898
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      noise.loop = true
      noiseSourceRef.current = noise

      // Lowpass filter for deep ocean rumble / soothing rain
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(type === 'ocean' ? 380 : 550, ctx.currentTime)

      // Main Gain
      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      gainNodeRef.current = gainNode

      // LFO for slow ocean swells if ocean type
      if (type === 'ocean') {
        const lfo = ctx.createOscillator()
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime) // 8-second wave swells
        const lfoGain = ctx.createGain()
        lfoGain.gain.setValueAtTime(0.15, ctx.currentTime)
        lfo.connect(lfoGain)
        lfoGain.connect(gainNode.gain)
        lfo.start()
      }

      noise.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)

      noise.start()
      setIsPlaying(true)
    } catch {
      // AudioContext unavailable
    }
  }

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio()
    } else {
      startAudio()
    }
  }

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime)
    }
  }, [volume])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isPlaying && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopAudio()
            onFinish()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isPlaying, secondsLeft, stopAudio, onFinish])

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  return (
    <div className="rounded-2xl border border-teal-400/25 bg-teal-500/[0.04] p-5 space-y-5 text-center">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="capitalize">{type} Ambience Session</span>
        <span className="font-mono text-teal-300">
          {mins}:{secs < 10 ? `0${secs}` : secs}
        </span>
      </div>

      {/* Visual soundwaves animation */}
      <div className="h-16 flex items-center justify-center gap-1.5">
        {[20, 45, 80, 55, 30, 90, 40, 70, 25, 60, 85, 35].map((h, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full bg-teal-400 transition-all duration-300 ${
              isPlaying ? 'animate-pulse' : 'opacity-25'
            }`}
            style={{
              height: isPlaying ? `${h}%` : '15%',
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={toggleAudio}
          className="rounded-xl border border-teal-400/40 bg-teal-400/20 px-6 py-2.5 text-xs sm:text-sm font-semibold text-teal-100 hover:bg-teal-400/30 transition-all flex items-center gap-2"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-teal-100" />}
          <span>{isPlaying ? 'Pause Sound' : 'Play Ambient Waves'}</span>
        </button>
      </div>

      <div className="max-w-xs mx-auto flex items-center gap-3 pt-2">
        {volume === 0 ? (
          <VolumeX className="h-4 w-4 text-white/40" />
        ) : (
          <Volume2 className="h-4 w-4 text-teal-300" />
        )}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-teal-400 cursor-pointer"
        />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   INTERACTIVE MODULE 5: VIDEO WORKSHOP VISUALIZER
   ────────────────────────────────────────────────────────────────────────── */
function VideoWorkshopVisualizer({ title, onFinish }: { title: string; onFinish: () => void }) {
  const [activeChapter, setActiveChapter] = useState(0)

  const chapters = [
    {
      title: '01: The Trap of Fusion',
      takeaway:
        'Noticing thoughts like clouds passing through the sky instead of personal identity.',
      tip: 'Say to yourself: "I notice I am having the thought that I am overwhelmed."',
    },
    {
      title: '02: Expanding Around Discomfort',
      takeaway: 'Making physical room for challenging sensations rather than fighting them.',
      tip: 'Take a slow belly breath and relax tension around your chest and jaw.',
    },
    {
      title: '03: Values-Guided Action',
      takeaway: 'Asking: "What would the wisest, most caring version of me do next?"',
      tip: 'Take one tiny 60-second action aligned with your core values.',
    },
  ]

  return (
    <div className="rounded-2xl border border-teal-400/25 bg-teal-500/[0.04] p-5 space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Interactive Video Workshop</span>
        <span className="font-mono text-teal-300">Chapter {activeChapter + 1} of 3</span>
      </div>

      {/* Simulated Video Player Screen */}
      <div className="relative aspect-video rounded-xl bg-black/60 border border-white/10 flex flex-col items-center justify-center p-6 text-center space-y-3 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 via-transparent to-violet-500/10" />
        <div className="h-12 w-12 rounded-full bg-teal-400/20 border border-teal-400/40 grid place-items-center relative z-10">
          <Play className="h-5 w-5 fill-teal-200 text-teal-200 ml-0.5" />
        </div>
        <p className="relative z-10 font-semibold text-sm sm:text-base text-white">
          {chapters[activeChapter].title}
        </p>
        <p className="relative z-10 text-xs text-white/70 max-w-sm">
          {chapters[activeChapter].takeaway}
        </p>
      </div>

      {/* Chapters buttons */}
      <div className="grid grid-cols-3 gap-2">
        {chapters.map((ch, idx) => (
          <button
            key={idx}
            onClick={() => setActiveChapter(idx)}
            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
              activeChapter === idx
                ? 'border-teal-400/40 bg-teal-400/15 text-teal-200'
                : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20'
            }`}
          >
            Part {idx + 1}
          </button>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/80">
        💡 <strong className="text-teal-200">Action Step:</strong> {chapters[activeChapter].tip}
      </div>
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
    <article className="card-portfolio p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold font-[family-name:var(--font-display)]">
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{detail}</p>
        </div>
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-teal-300/20 bg-teal-400/10 grid place-items-center shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-teal-200" />
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
      <div className="h-8 w-8 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] grid place-items-center">
        <Icon className="h-4 w-4 text-teal-200" />
      </div>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
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
    <div className="space-y-2">
      <p className="text-xs font-medium text-white/60">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) => (
          <button
            key={value}
            onClick={() => onToggle(value)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-all ${
              selected.includes(value)
                ? 'border-teal-300/40 bg-teal-400/15 text-teal-100 shadow-sm shadow-teal-500/10'
                : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80'
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center sm:text-left">
      <Icon className="h-4 w-4 text-teal-200 mx-auto sm:mx-0" />
      <p className="mt-2 text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs sm:text-sm font-semibold capitalize truncate">{value}</p>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] capitalize text-white/60">
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
      return Play
    case 'exercise':
      return Target
    case 'activity':
      return Compass
    default:
      return Library
  }
}
