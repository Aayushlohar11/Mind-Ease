export function PortfolioBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen portfolio-grid">
      <div className="pointer-events-none absolute inset-0 portfolio-glow" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
