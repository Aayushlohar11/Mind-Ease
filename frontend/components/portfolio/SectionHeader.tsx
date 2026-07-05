interface SectionHeaderProps {
  number: string
  title: string
  subtitle?: string
}

export function SectionHeader({ number, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-12">
      <p className="font-mono text-sm text-teal-400 mb-2">{number}</p>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground max-w-2xl">{subtitle}</p>}
    </div>
  )
}
