'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@frontend/components/ui/button'
import { cn } from '@frontend/lib/utils'

const publicLinks = [
  { href: '/#about', label: 'About' },
  { href: '/#work', label: 'Features' },
  { href: '/#contact', label: 'Contact' },
]

const appLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/chat', label: 'Chat' },
  { href: '/mood', label: 'Mood' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/recommendations', label: 'Resources' },
  { href: '/profile', label: 'Profile' },
]

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isHome = pathname === '/'

  const links = session ? appLinks : isHome ? publicLinks : []

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] font-bold text-lg tracking-tight"
        >
          Mind<span className="text-teal-400">Ease</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-2 text-sm rounded-lg transition-colors',
                pathname === link.href
                  ? 'text-teal-400 bg-teal-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[120px]">
                {session.user?.name}
              </span>
              <Button
                onClick={() => signOut({ callbackUrl: '/' })}
                variant="outline"
                size="sm"
                className="border-white/15 bg-transparent hover:bg-white/5"
              >
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
      </div>
    </header>
  )
}
