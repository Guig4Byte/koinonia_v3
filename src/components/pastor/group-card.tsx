"use client"

import Link from "next/link"
import { Users, TrendingUp, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type DashboardGroup = {
  id: string
  name: string
  memberCount: number
  atRiskCount: number
  lastAttendanceRate: number | null
  leaderName: string | null
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
