"use client"

import { cn } from "@/lib/utils"

const levelClasses: Record<string, string> = {
  risk: "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]",
  warn: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
  ok: "border-[var(--ok-border)] bg-[var(--ok-bg)] text-[var(--ok)]",
  new: "border-[var(--new-border)] bg-[var(--new-bg)] text-[var(--new)]",
}

const labels: Record<string, string> = {
  risk: "Em risco",
  warn: "Atenção",
  ok: "Ativo",
  new: "Novo",
}

interface RiskBadgeProps {
  level?: "risk" | "warn" | "ok" | "new"
  className?: string
}

export function RiskBadge({ level = "ok", className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        levelClasses[level],
        className
      )}
    >
      {labels[level]}
    </span>
  )
}
