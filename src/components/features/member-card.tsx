"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { ContextSignalList } from "./context-signal-list"
import { RiskBadge } from "./risk-badge"

interface MemberCardProps {
  id: string
  name: string
  status?: string | undefined
  riskLevel?: "risk" | "warn" | "ok" | "new" | undefined
  note?: string | undefined
  avatarUrl?: string | null | undefined
  signalReasons?: string[] | undefined
  className?: string | undefined
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function MemberCard({
  id,
  name,
  status,
  riskLevel,
  note,
  avatarUrl,
  signalReasons,
  className,
}: MemberCardProps) {
  const initials = getInitials(name)

  return (
    <Link
      href={`/membro/${id}`}
      className={cn(
        "flex items-start gap-3 rounded-2xl bg-[var(--card)] p-4 border border-[var(--border)] shadow-sm transition",
        "active:scale-[0.98] hover:bg-[var(--surface)]",
        className
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-secondary)]",
          riskLevel === "risk" && "ring-2 ring-[var(--risk)] ring-offset-2 ring-offset-[var(--bg)]",
          riskLevel === "warn" && "ring-2 ring-[var(--warn)] ring-offset-2 ring-offset-[var(--bg)]"
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-semibold">{initials}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">
            {name}
          </h3>
          {riskLevel ? <RiskBadge level={riskLevel} /> : null}
        </div>

        {status ? (
          <p className="text-sm text-[var(--text-muted)]">{status}</p>
        ) : null}

        {note ? (
          <p className="truncate text-sm text-[var(--text-secondary)]">
            {note}
          </p>
        ) : null}

        {signalReasons ? (
          <ContextSignalList
            signals={signalReasons}
            tone={riskLevel === "risk" ? "risk" : riskLevel === "warn" ? "warn" : "neutral"}
            className="mt-2"
          />
        ) : null}
      </div>
    </Link>
  )
}
