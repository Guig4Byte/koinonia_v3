"use client"

import Link from "next/link"
import { AlertTriangle, TrendingUp, Users } from "lucide-react"
import { ContextSignalList } from "@/components/features/context-signal-list"
import { cn } from "@/lib/utils"

type DashboardGroup = {
  id: string
  name: string
  memberCount: number
  atRiskCount: number
  lastAttendanceRate: number | null
  leaderName: string | null
}

function getGroupSignals(group: DashboardGroup) {
  const signals: string[] = []

  if (group.atRiskCount > 0) {
    signals.push(
      `${group.atRiskCount} ${group.atRiskCount === 1 ? "pessoa em cuidado" : "pessoas em cuidado"}`,
    )
  }

  if (group.lastAttendanceRate !== null && group.lastAttendanceRate < 70) {
    signals.push(`Último encontro com ${group.lastAttendanceRate}% de presença`)
  }

  if (signals.length === 0 && group.lastAttendanceRate !== null) {
    signals.push(`Último encontro com ${group.lastAttendanceRate}% de presença`)
  }

  return signals
}

export function GroupCard({
  group,
  href,
}: {
  group: DashboardGroup
  href?: string
}) {
  const className = cn(
    "flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--card)] p-3",
    href && "transition hover:bg-[var(--surface)]"
  )

  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--text-muted)]">
        <Users className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium">{group.name}</p>
          {group.atRiskCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-[var(--risk)]">
              <AlertTriangle className="h-3 w-3" />
              {group.atRiskCount}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span>{group.memberCount} membros</span>
          {group.lastAttendanceRate !== null && (
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {group.lastAttendanceRate}% última
            </span>
          )}
        </div>
        {group.leaderName && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Líder: {group.leaderName}
          </p>
        )}
        <ContextSignalList
          signals={getGroupSignals(group)}
          tone={group.atRiskCount > 0 ? "risk" : group.lastAttendanceRate !== null && group.lastAttendanceRate < 70 ? "warn" : "neutral"}
          className="mt-3"
        />
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}
