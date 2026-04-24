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
    risk: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30",
    ok: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30",
  }

  const iconClass = {
    default: "text-[var(--text-muted)]",
    risk: "text-red-600 dark:text-red-400",
    ok: "text-emerald-600 dark:text-emerald-400",
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-[var(--border-light)] p-3", accentClass[accent])}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg)]", iconClass[accent])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}
