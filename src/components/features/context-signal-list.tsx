import { cn } from "@/lib/utils"

type ContextSignalTone = "neutral" | "risk" | "warn" | "ok" | "new"

const toneClasses: Record<ContextSignalTone, string> = {
  neutral: "border-[var(--border-light)] bg-[var(--surface-soft)] text-[var(--text-secondary)]",
  risk: "border-[var(--risk-border)] bg-[var(--surface-soft)] text-[var(--risk)]",
  warn: "border-[var(--warn-border)] bg-[var(--surface-soft)] text-[var(--warn)]",
  ok: "border-[var(--ok-border)] bg-[var(--surface-soft)] text-[var(--ok)]",
  new: "border-[var(--new-border)] bg-[var(--surface-soft)] text-[var(--new)]",
}

interface ContextSignalListProps {
  signals: string[]
  title?: string
  tone?: ContextSignalTone
  className?: string
}

function normalizeSignals(signals: string[]) {
  const seen = new Set<string>()

  return signals
    .map((signal) => signal.trim())
    .filter((signal) => {
      if (!signal || seen.has(signal)) return false
      seen.add(signal)
      return true
    })
}

export function ContextSignalList({
  signals,
  title = "Por que apareceu aqui?",
  tone = "neutral",
  className,
}: ContextSignalListProps) {
  const visibleSignals = normalizeSignals(signals)

  if (visibleSignals.length === 0) return null

  return (
    <div className={cn("rounded-xl border px-3 py-2.5", toneClasses[tone], className)}>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {title}
      </p>
      <div className="mt-2 space-y-1.5">
        {visibleSignals.map((signal) => (
          <div key={signal} className="flex gap-2 text-xs leading-5 text-[var(--text-secondary)]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
            <span>{signal}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
