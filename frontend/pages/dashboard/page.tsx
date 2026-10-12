'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@frontend/components/ui/button'
import { PortfolioBackground } from '@frontend/components/portfolio/PortfolioBackground'
import { SectionHeader } from '@frontend/components/portfolio/SectionHeader'
import {
  MessageCircle,
  LineChart,
  BarChart3,
  BookOpen,
  User,
  LogOut,
  ArrowUpRight,
} from 'lucide-react'

const tools = [
  {
    title: 'AI Chat',
    description: 'Talk to your empathetic AI companion',
    href: '/chat',
    icon: MessageCircle,
    color: 'text-teal-400',
  },
  {
    title: 'Mood Tracker',
    description: 'Log and review your emotional patterns',
    href: '/mood',
    icon: LineChart,
    color: 'text-violet-400',
  },
  {
    title: 'Analytics',
    description: 'Insights, trends, and summaries',
    href: '/analytics',
    icon: BarChart3,
    color: 'text-amber-400',
  },
  {
    title: 'Resources',
    description: 'Personalized wellness content',
    href: '/recommendations',
    icon: BookOpen,
    color: 'text-rose-400',
  },
  {
    title: 'Profile',
    description: 'Preferences and account settings',
    href: '/profile',
    icon: User,
    color: 'text-cyan-400',
  },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-mono text-sm">Loading workspace...</p>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/login')
    return null
  }

  return (
    <PortfolioBackground>
      <div className="pt-24 pb-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <p className="font-mono text-sm text-teal-400 mb-2">Workspace</p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight">
              Hey, {session.user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-muted-foreground mt-2">{session.user?.email}</p>
          </div>
          <Button
            onClick={() => signOut({ callbackUrl: '/' })}
            variant="outline"
            size="sm"
            className="border-white/15 gap-2 w-fit"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>

        <div className="card-portfolio p-6 mb-12 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-lg font-medium text-teal-400">All systems ready</p>
          </div>
          <p className="text-xs font-mono text-muted-foreground hidden sm:block">
            ID: {session.user?.id?.slice(0, 20)}...
          </p>
        </div>

        <SectionHeader
          number="Tools"
          title="Your toolkit"
          subtitle="Pick a module to continue your wellness journey."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group">
              <article className="card-portfolio p-6 h-full flex flex-col">
                <tool.icon className={`w-8 h-8 ${tool.color} mb-4`} />
                <h3 className="font-semibold text-lg group-hover:text-teal-400 transition-colors flex items-center gap-2">
                  {tool.title}
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-muted-foreground mt-2 flex-1">{tool.description}</p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </PortfolioBackground>
  )
}
