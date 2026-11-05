'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  LayoutDashboard,
  MessageCircle,
  LineChart,
  BarChart3,
  BookOpen,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { Button } from '@frontend/components/ui/button'
import { cn } from '@frontend/lib/utils'
import { DeepHealingAudioButton } from '@frontend/components/audio/DeepHealingAudioButton'

const publicLinks = [
  { href: '/#about', label: 'About' },
  { href: '/#work', label: 'Features' },
  { href: '/#contact', label: 'Contact' },
]

const appLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/mood', label: 'Mood', icon: LineChart },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/recommendations', label: 'Resources', icon: BookOpen, aliases: ['/resources'] },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on page transition
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const links = session ? appLinks : isHome ? publicLinks : []

  const isLinkActive = (link: { href: string; aliases?: string[] }) => {
    if (pathname === link.href) return true
    if (link.aliases?.some((alias) => pathname === alias || pathname.startsWith(alias + '/'))) {
      return true
    }
    return false
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] font-bold text-lg tracking-tight flex items-center gap-2 group"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="h-8 w-8 rounded-xl bg-teal-500/10 border border-teal-500/30 grid place-items-center transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-teal-400" />
          </div>
          <span>
            Mind<span className="text-teal-400">Ease</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const active = isLinkActive(link)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-2 text-sm rounded-lg font-medium transition-all duration-200',
                  active
                    ? 'text-teal-400 bg-teal-500/15 border border-teal-500/25 shadow-sm shadow-teal-500/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <DeepHealingAudioButton />
          {session ? (
            <>
              <span className="text-xs text-muted-foreground truncate max-w-[130px] font-mono">
                {session.user?.name || session.user?.email?.split('@')[0]}
              </span>
              <Button
                onClick={() => signOut({ callbackUrl: '/' })}
                variant="outline"
                size="sm"
                className="border-white/15 bg-transparent hover:bg-white/5 gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  size="sm"
                  className="bg-teal-500 hover:bg-teal-400 text-background font-medium"
                >
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <DeepHealingAudioButton compact />
          {session && (
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[100px]">
              {session.user?.name?.split(' ')[0] || 'User'}
            </span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] active:scale-95 transition-all"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-teal-300" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-background/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl p-5 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto glass-scrollbar animate-in slide-in-from-top-3 duration-200">
          {/* Quick Ambient Music for Mobile */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Deep Healing Music</span>
            <DeepHealingAudioButton />
          </div>

          <nav className="flex flex-col gap-1.5">
            {links.map((link) => {
              const active = isLinkActive(link)
              const Icon = (link as any).icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[46px]',
                    active
                      ? 'text-teal-200 bg-teal-500/20 border border-teal-500/30 font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 text-teal-400 shrink-0" />}
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Mobile User / Auth Section */}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            {session ? (
              <>
                <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-medium text-white truncate">
                    {session.user?.name || session.user?.email}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  variant="outline"
                  size="default"
                  className="w-full border-white/15 bg-white/[0.03] hover:bg-white/[0.08] gap-2 min-h-[44px]"
                >
                  <LogOut className="h-4 w-4 text-red-400" />
                  Sign out
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-white/15 min-h-[44px]">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-teal-500 hover:bg-teal-400 text-background font-semibold min-h-[44px]">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
