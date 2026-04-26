"use client"

import { cn } from "@/lib/utils"

interface SummaryCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: "default" | "risk" | "ok"
}

export function SummaryCard({ label, value, icon, accent = "default" }: SummaryCardProps) {
  const accentClass = {
    default: "bg-[var(--surface)]",
    risk: "bg-[var(--risk-bg)] border-[var(--risk-border)]",
    ok: "bg-[var(--ok-bg)] border-[var(--ok-border)]",
  }

  const iconClass = {
    default: "text-[var(--text-muted)]",
    risk: "text-[var(--risk)]",
    ok: "text-[var(--ok)]",
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-[var(--border-light)] p-3", accentClass[accent])}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--card)]", iconClass[accent])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}
