import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import '../styles/globals.css'
import { SessionProvider } from '@frontend/components/providers/session-provider'
import { Navbar } from '@frontend/components/navigation/Navbar'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MindEase - AI Mental Health Platform',
  description:
    'Portfolio-grade mental wellness app with AI chat, mood tracking, and personalized insights.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-[family-name:var(--font-body)] min-h-screen">
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
