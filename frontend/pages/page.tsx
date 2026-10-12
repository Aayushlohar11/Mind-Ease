import Link from 'next/link'
import { Button } from '@frontend/components/ui/button'
import { PortfolioBackground } from '@frontend/components/portfolio/PortfolioBackground'
import { SectionHeader } from '@frontend/components/portfolio/SectionHeader'
import { MessageCircle, LineChart, Sparkles, Shield, Brain, ArrowUpRight } from 'lucide-react'

const projects = [
  {
    title: 'AI Chat Support',
    tag: 'Core Product',
    description:
      'Empathetic conversational AI with crisis detection and sentiment-aware responses, available around the clock.',
    href: '/auth/signup',
    icon: MessageCircle,
    accent: 'from-teal-500/20 to-cyan-500/5',
  },
  {
    title: 'Mood Tracker',
    tag: 'Wellness',
    description:
      'Log daily moods, intensity, triggers, and notes - then visualize patterns over weeks and months.',
    href: '/auth/signup',
    icon: LineChart,
    accent: 'from-violet-500/20 to-purple-500/5',
  },
  {
    title: 'Analytics Dashboard',
    tag: 'Insights',
    description:
      'Personalized trends, dominant moods, and predictive insights built from your wellness data.',
    href: '/auth/signup',
    icon: Sparkles,
    accent: 'from-amber-500/20 to-orange-500/5',
  },
  {
    title: 'Smart Resources',
    tag: 'Recommendations',
    description:
      'Content recommendations tailored to how you feel - exercises, articles, and guided practices.',
    href: '/auth/signup',
    icon: Brain,
    accent: 'from-rose-500/20 to-pink-500/5',
  },
]

const stats = [
  { value: '24/7', label: 'AI availability' },
  { value: '6+', label: 'Wellness tools' },
  { value: '100%', label: 'Privacy-first' },
]

export default function Home() {
  return (
    <PortfolioBackground>
      <main className="pt-16">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-32">
          <p className="font-mono text-sm text-teal-400 mb-6 animate-fade-in">Hi, welcome to -</p>
          <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            <span className="text-gradient">MindEase</span>
            <br />
            <span className="text-foreground/90">Mental wellness, reimagined.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            A full-stack mental health platform - AI chat, mood tracking, analytics, and
            personalized resources. Built like a portfolio piece: thoughtful design, modern stack,
            real features.
          </p>
          <div className="flex flex-wrap gap-4 mb-16">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-teal-500 hover:bg-teal-400 text-background gap-2 h-12 px-8"
              >
                Start your journey
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 border-white/15 bg-transparent hover:bg-white/5"
              >
                Sign in
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-10 pt-8 border-t border-white/10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-bold text-teal-400 font-[family-name:var(--font-display)]">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section
          id="about"
          className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-white/10"
        >
          <SectionHeader
            number="01 - About"
            title="What is MindEase?"
            subtitle="More than an app - a complete mental wellness experience with production-ready auth, APIs, and a polished interface."
          />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-portfolio p-8">
              <Shield className="w-8 h-8 text-teal-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Privacy & trust</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Encrypted sessions, exportable data, and transparent policies. Your mental health
                journey stays yours.
              </p>
            </div>
            <div className="card-portfolio p-8">
              <Sparkles className="w-8 h-8 text-violet-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI that listens</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                OpenAI-powered conversations with fallback support, crisis keyword detection, and
                sentiment analysis on every message.
              </p>
            </div>
          </div>
        </section>

        {/* Features / Work */}
        <section
          id="work"
          className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-white/10"
        >
          <SectionHeader
            number="02 - Selected work"
            title="Platform features"
            subtitle="Explore the core modules - each designed as a distinct product experience."
          />
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Link key={project.title} href={project.href} className="group block">
                <article
                  className={`card-portfolio p-8 h-full bg-gradient-to-br ${project.accent}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <project.icon className="w-10 h-10 text-teal-400" />
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-teal-400 transition-colors" />
                  </div>
                  <span className="font-mono text-xs text-teal-400/80">{project.tag}</span>
                  <h3 className="text-xl font-semibold mt-2 mb-3 group-hover:text-teal-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* Contact / CTA */}
        <section
          id="contact"
          className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-white/10"
        >
          <SectionHeader
            number="03 - Get in touch"
            title="Ready to explore?"
            subtitle="Create a free account and access every feature from your personal dashboard."
          />
          <div className="card-portfolio p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 portfolio-glow opacity-50" aria-hidden />
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 font-[family-name:var(--font-display)]">
                Start building your wellness story
              </h3>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join MindEase today - no credit card, no complexity. Just sign up and begin.
              </p>
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-teal-500 hover:bg-teal-400 text-background h-12 px-10"
                >
                  Create free account
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} MindEase. Built with care.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-teal-400 transition-colors">
                Privacy
              </Link>
              <Link href="/auth/login" className="hover:text-teal-400 transition-colors">
                Login
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </PortfolioBackground>
  )
}
