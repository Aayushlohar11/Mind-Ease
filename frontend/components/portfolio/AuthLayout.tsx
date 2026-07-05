import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex portfolio-grid">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-white/10">
        <div className="absolute inset-0 portfolio-glow" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="font-bold text-xl tracking-tight">
            Mind<span className="text-teal-400">Ease</span>
          </Link>
          <div>
            <p className="font-mono text-teal-400 text-sm mb-4">Mental wellness platform</p>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Your journey to better mental health starts here.
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              AI-powered support, mood insights, and personalized resources — designed with care.
            </p>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <span>24/7 AI Chat</span>
            <span>Mood Tracking</span>
            <span>Analytics</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden text-center mb-4">
            <Link href="/" className="font-bold text-xl">
              Mind<span className="text-teal-400">Ease</span>
            </Link>
          </div>
          <div className="text-center lg:text-left space-y-1">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>
          <div className="card-portfolio p-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
