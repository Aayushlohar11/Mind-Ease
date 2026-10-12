'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  Download,
  Eye,
  Lock,
  Mail,
  MapPin,
  Palette,
  Save,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { Button } from '@frontend/components/ui/button'
import { Input } from '@frontend/components/ui/input'
import { PortfolioBackground } from '@frontend/components/portfolio/PortfolioBackground'
import type { UserPreferences, UserProfile } from '@backend/types/user'

type AccountForm = {
  name: string
  email: string
}

type Notice = {
  type: 'success' | 'error'
  text: string
}

const defaultPreferences: UserPreferences = {
  userId: '',
  theme: 'system',
  notifications: {
    email: true,
    push: false,
    moodReminders: true,
    weeklyInsights: true,
    contentRecommendations: true,
  },
  privacy: {
    shareAnonymousData: false,
    allowAnalytics: false,
    dataRetentionDays: 30,
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
    screenReaderOptimized: false,
  },
}

const profileDefaults: Partial<UserProfile> = {
  avatarUrl: '',
  bio: '',
  location: '',
  timezone: '',
}

const fontSizeOptions = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
] as const

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [account, setAccount] = useState<AccountForm>({ name: '', email: '' })
  const [profile, setProfile] = useState<Partial<UserProfile>>(profileDefaults)
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const completionScore = useMemo(() => {
    const fields = [account.name, account.email, profile.bio, profile.location, profile.timezone]
    return Math.round((fields.filter(Boolean).length / fields.length) * 100)
  }, [account, profile])

  const joinedLabel = useMemo(() => {
    const createdAt = session?.user ? (session.user as { createdAt?: string }).createdAt : undefined

    if (!createdAt) {
      return 'Active member'
    }

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(createdAt))
  }, [session])

  const initials = useMemo(() => {
    const source = account.name || session?.user?.name || session?.user?.email || 'SS'
    return source
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [account.name, session])

  const fetchUserData = useCallback(async () => {
    setIsLoading(true)
    setNotice(null)

    try {
      const [userRes, profileRes, preferencesRes] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/user/profile'),
        fetch('/api/user/preferences'),
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setAccount({
          name: userData.data?.name || session?.user?.name || '',
          email: userData.data?.email || session?.user?.email || '',
        })
      } else {
        setAccount({
          name: session?.user?.name || '',
          email: session?.user?.email || '',
        })
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile({ ...profileDefaults, ...(profileData.data || {}) })
      }

      if (preferencesRes.ok) {
        const preferencesData = await preferencesRes.json()
        const incoming = preferencesData.data || {}
        setPreferences({
          ...defaultPreferences,
          ...incoming,
          notifications: {
            ...defaultPreferences.notifications,
            ...incoming.notifications,
          },
          privacy: {
            ...defaultPreferences.privacy,
            ...incoming.privacy,
          },
          accessibility: {
            ...defaultPreferences.accessibility,
            ...incoming.accessibility,
          },
        })
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      setNotice({ type: 'error', text: 'Could not load your profile settings.' })
    } finally {
      setIsLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchUserData()
    }
  }, [fetchUserData, status, router])

  const saveAccount = async () => {
    setSavingSection('account')
    setNotice(null)

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      })

      if (!response.ok) {
        throw new Error('Failed to update account')
      }

      setNotice({ type: 'success', text: 'Account details saved.' })
    } catch (error) {
      setNotice({ type: 'error', text: 'Account details could not be saved.' })
    } finally {
      setSavingSection(null)
    }
  }

  const saveProfile = async () => {
    setSavingSection('profile')
    setNotice(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await response.json()
      setProfile({ ...profileDefaults, ...(data.data || {}) })
      setNotice({ type: 'success', text: 'Profile information saved.' })
    } catch (error) {
      setNotice({ type: 'error', text: 'Profile information could not be saved.' })
    } finally {
      setSavingSection(null)
    }
  }

  const savePreferences = async () => {
    setSavingSection('preferences')
    setNotice(null)

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      const data = await response.json()
      setPreferences({
        ...defaultPreferences,
        ...(data.data || {}),
        notifications: {
          ...defaultPreferences.notifications,
          ...(data.data?.notifications || {}),
        },
        privacy: {
          ...defaultPreferences.privacy,
          ...(data.data?.privacy || {}),
        },
        accessibility: {
          ...defaultPreferences.accessibility,
          ...(data.data?.accessibility || {}),
        },
      })
      setNotice({ type: 'success', text: 'Preferences saved.' })
    } catch (error) {
      setNotice({ type: 'error', text: 'Preferences could not be saved.' })
    } finally {
      setSavingSection(null)
    }
  }

  const exportData = async () => {
    setSavingSection('export')
    setNotice(null)

    try {
      const response = await fetch('/api/user/export')

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mindease-data-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setNotice({ type: 'success', text: 'Your data export has started.' })
    } catch (error) {
      setNotice({ type: 'error', text: 'Data export could not be created.' })
    } finally {
      setSavingSection(null)
    }
  }

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setNotice({ type: 'error', text: 'Type DELETE before removing your account.' })
      return
    }

    setSavingSection('delete')
    setNotice(null)

    try {
      const response = await fetch('/api/user', { method: 'DELETE' })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      await signOut({ callbackUrl: '/' })
    } catch (error) {
      setNotice({ type: 'error', text: 'Account could not be deleted.' })
      setSavingSection(null)
    }
  }

  const setNotification = (key: keyof UserPreferences['notifications'], value: boolean) => {
    setPreferences((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [key]: value,
      },
    }))
  }

  const setPrivacy = <Key extends keyof UserPreferences['privacy']>(
    key: Key,
    value: UserPreferences['privacy'][Key]
  ) => {
    setPreferences((current) => ({
      ...current,
      privacy: {
        ...current.privacy,
        [key]: value,
      },
    }))
  }

  const setAccessibility = <Key extends keyof UserPreferences['accessibility']>(
    key: Key,
    value: UserPreferences['accessibility'][Key]
  ) => {
    setPreferences((current) => ({
      ...current,
      accessibility: {
        ...current.accessibility,
        [key]: value,
      },
    }))
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-mono text-sm text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <PortfolioBackground>
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="card-portfolio p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-2xl border border-teal-400/30 bg-teal-500/10 grid place-items-center overflow-hidden">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="text-xl font-bold text-teal-300">{initials}</span>
                )}
              </div>
              <div>
                <p className="font-mono text-xs text-teal-400 mb-1">05 - Profile</p>
                <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
                  Profile Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your account, privacy, accessibility, and wellness preferences.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="border-white/15 bg-transparent hover:bg-white/5 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <Button onClick={fetchUserData} variant="secondary" className="gap-2">
                <Eye className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {notice && (
          <div
            className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
              notice.type === 'success'
                ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                : 'border-red-400/25 bg-red-500/10 text-red-200'
            }`}
          >
            {notice.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span className="text-sm font-medium">{notice.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <aside className="space-y-6">
            <section className="card-portfolio p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Profile health</p>
                  <p className="text-3xl font-bold mt-1">{completionScore}%</p>
                </div>
                <div className="h-14 w-14 rounded-xl border border-teal-400/20 bg-teal-500/10 grid place-items-center">
                  <User className="h-6 w-6 text-teal-300" />
                </div>
              </div>
              <div className="mt-5 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-400 transition-all"
                  style={{ width: `${completionScore}%` }}
                />
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <ProfileFact icon={Mail} label="Email" value={account.email || 'Not set'} />
                <ProfileFact icon={MapPin} label="Location" value={profile.location || 'Not set'} />
                <ProfileFact icon={Shield} label="Joined" value={joinedLabel} />
              </div>
            </section>

            <section className="card-portfolio p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl border border-cyan-400/20 bg-cyan-500/10 grid place-items-center">
                  <Download className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <h2 className="font-semibold">Data tools</h2>
                  <p className="text-sm text-muted-foreground">
                    Export or manage your account data.
                  </p>
                </div>
              </div>
              <Button
                onClick={exportData}
                disabled={savingSection === 'export'}
                variant="outline"
                className="w-full border-white/15 bg-transparent hover:bg-white/5 gap-2"
              >
                <Download className="h-4 w-4" />
                {savingSection === 'export' ? 'Preparing...' : 'Export data'}
              </Button>
            </section>

            <section className="card-portfolio p-6 border-red-500/20">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl border border-red-400/20 bg-red-500/10 grid place-items-center">
                  <Trash2 className="h-5 w-5 text-red-300" />
                </div>
                <div>
                  <h2 className="font-semibold">Danger zone</h2>
                  <p className="text-sm text-muted-foreground">This removes the current account.</p>
                </div>
              </div>
              <Input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder="Type DELETE"
                className="mb-3"
              />
              <Button
                onClick={deleteAccount}
                disabled={savingSection === 'delete'}
                variant="destructive"
                className="w-full gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {savingSection === 'delete' ? 'Deleting...' : 'Delete account'}
              </Button>
            </section>
          </aside>

          <main className="space-y-6">
            <section className="card-portfolio p-6">
              <SectionTitle
                icon={User}
                title="Account"
                subtitle="Update the name and email shown across your workspace."
              />
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Field label="Name">
                  <Input
                    value={account.name}
                    onChange={(event) => setAccount({ ...account, name: event.target.value })}
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={account.email}
                    onChange={(event) => setAccount({ ...account, email: event.target.value })}
                    placeholder="you@example.com"
                  />
                </Field>
              </div>
              <SaveButton
                onClick={saveAccount}
                loading={savingSection === 'account'}
                label="Save account"
              />
            </section>

            <section className="card-portfolio p-6">
              <SectionTitle
                icon={Palette}
                title="Public Profile"
                subtitle="Personalize the context MindEase uses to make the app feel yours."
              />
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Field label="Avatar URL">
                  <Input
                    value={profile.avatarUrl || ''}
                    onChange={(event) => setProfile({ ...profile, avatarUrl: event.target.value })}
                    placeholder="https://..."
                  />
                </Field>
                <Field label="Location">
                  <Input
                    value={profile.location || ''}
                    onChange={(event) => setProfile({ ...profile, location: event.target.value })}
                    placeholder="City, Country"
                  />
                </Field>
                <Field label="Timezone">
                  <Input
                    value={profile.timezone || ''}
                    onChange={(event) => setProfile({ ...profile, timezone: event.target.value })}
                    placeholder="Asia/Kolkata"
                  />
                </Field>
                <Field label="Date of birth">
                  <Input
                    type="date"
                    value={profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : ''}
                    onChange={(event) =>
                      setProfile({ ...profile, dateOfBirth: event.target.value as any })
                    }
                  />
                </Field>
                <Field label="Bio" className="sm:col-span-2">
                  <textarea
                    value={profile.bio || ''}
                    onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                    placeholder="A few lines about your goals, routines, or what support feels helpful."
                    rows={4}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  />
                </Field>
              </div>
              <SaveButton
                onClick={saveProfile}
                loading={savingSection === 'profile'}
                label="Save profile"
              />
            </section>

            <section className="card-portfolio p-6">
              <SectionTitle
                icon={Bell}
                title="Notifications"
                subtitle="Choose the check-ins and updates you want MindEase to send."
              />
              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                <ToggleRow
                  label="Email notifications"
                  description="Receive important account and wellness updates."
                  checked={preferences.notifications.email}
                  onChange={(checked) => setNotification('email', checked)}
                />
                <ToggleRow
                  label="Push notifications"
                  description="Enable reminders on supported devices."
                  checked={preferences.notifications.push}
                  onChange={(checked) => setNotification('push', checked)}
                />
                <ToggleRow
                  label="Mood reminders"
                  description="Get gentle prompts to log your mood."
                  checked={preferences.notifications.moodReminders}
                  onChange={(checked) => setNotification('moodReminders', checked)}
                />
                <ToggleRow
                  label="Weekly insights"
                  description="Receive a summary of patterns and progress."
                  checked={preferences.notifications.weeklyInsights}
                  onChange={(checked) => setNotification('weeklyInsights', checked)}
                />
                <ToggleRow
                  label="Content recommendations"
                  description="Let resources surface when they match your needs."
                  checked={preferences.notifications.contentRecommendations}
                  onChange={(checked) => setNotification('contentRecommendations', checked)}
                />
              </div>
            </section>

            <section className="card-portfolio p-6">
              <SectionTitle
                icon={Lock}
                title="Privacy"
                subtitle="Control analytics, anonymous data use, and retention."
              />
              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                <ToggleRow
                  label="Allow analytics"
                  description="Use activity data to improve personal insights."
                  checked={preferences.privacy.allowAnalytics}
                  onChange={(checked) => setPrivacy('allowAnalytics', checked)}
                />
                <ToggleRow
                  label="Share anonymous data"
                  description="Help improve MindEase without identifying you."
                  checked={preferences.privacy.shareAnonymousData}
                  onChange={(checked) => setPrivacy('shareAnonymousData', checked)}
                />
              </div>
              <Field
                label={`Data retention: ${preferences.privacy.dataRetentionDays} days`}
                className="mt-5"
              >
                <input
                  type="range"
                  min="7"
                  max="365"
                  step="1"
                  value={preferences.privacy.dataRetentionDays}
                  onChange={(event) => setPrivacy('dataRetentionDays', Number(event.target.value))}
                  className="w-full accent-teal-400"
                />
              </Field>
            </section>

            <section className="card-portfolio p-6">
              <SectionTitle
                icon={Eye}
                title="Accessibility"
                subtitle="Tune visual comfort and motion for everyday use."
              />
              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                {fontSizeOptions.map((option) => (
                  <SegmentButton
                    key={option.value}
                    active={preferences.accessibility.fontSize === option.value}
                    onClick={() => setAccessibility('fontSize', option.value)}
                    label={option.label}
                  />
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-5">
                <ToggleRow
                  label="High contrast"
                  description="Increase separation between text and surfaces."
                  checked={preferences.accessibility.highContrast}
                  onChange={(checked) => setAccessibility('highContrast', checked)}
                />
                <ToggleRow
                  label="Reduce motion"
                  description="Minimize animated transitions."
                  checked={preferences.accessibility.reduceMotion}
                  onChange={(checked) => setAccessibility('reduceMotion', checked)}
                />
                <ToggleRow
                  label="Screen reader optimized"
                  description="Favor labels and structure for assistive tools."
                  checked={preferences.accessibility.screenReaderOptimized}
                  onChange={(checked) => setAccessibility('screenReaderOptimized', checked)}
                />
              </div>
            </section>

            <section className="card-portfolio p-6">
              <SectionTitle
                icon={Palette}
                title="Appearance"
                subtitle="Choose how the interface should follow your environment."
              />
              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                {themeOptions.map((option) => (
                  <SegmentButton
                    key={option.value}
                    active={preferences.theme === option.value}
                    onClick={() =>
                      setPreferences((current) => ({
                        ...current,
                        theme: option.value,
                      }))
                    }
                    label={option.label}
                  />
                ))}
              </div>
              <SaveButton
                onClick={savePreferences}
                loading={savingSection === 'preferences'}
                label="Save preferences"
              />
            </section>
          </main>
        </div>
      </div>
    </PortfolioBackground>
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
      <div className="h-10 w-10 shrink-0 rounded-xl border border-teal-400/20 bg-teal-500/10 grid place-items-center">
        <Icon className="h-5 w-5 text-teal-300" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function SaveButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void
  loading: boolean
  label: string
}) {
  return (
    <div className="mt-6 flex justify-end">
      <Button onClick={onClick} disabled={loading} className="gap-2">
        <Save className="h-4 w-4" />
        {loading ? 'Saving...' : label}
      </Button>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-teal-400/30 transition-colors">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-teal-400"
      />
    </label>
  )
}

function SegmentButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'border-teal-400/40 bg-teal-500/15 text-teal-200'
          : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

function ProfileFact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm">{value}</p>
      </div>
    </div>
  )
}
