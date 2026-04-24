"use client"

import { useSupervisorGroups } from "@/hooks/use-supervisor-groups"
import { Users, TrendingUp, AlertTriangle, CalendarX } from "lucide-react"
import Link from "next/link"

export default function SupervisorCelulasPage() {
  const { data, isLoading } = useSupervisorGroups()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--surface)]" />
        ))}
      </div>
    )
  }

  const groups = data?.groups ?? []

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-[var(--text-secondary)]">
        Minhas Células
      </h2>

      {groups.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Nenhuma célula supervisionada
          </p>
        </div>
      )}

      <div className="space-y-3">
        {groups.map((group) => {
          const isZeroAttendance = group.averageAttendance === 0 && group.memberCount > 0
          return (
            <Link
              key={group.id}
              href={`/supervisor/celulas/${group.id}`}
              className={`group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-[var(--border-light)] p-4 transition active:scale-[0.98] ${
                isZeroAttendance
                  ? "bg-gradient-to-br from-amber-50/60 to-[var(--card)] hover:from-amber-50 hover:to-[var(--surface)] dark:from-amber-950/10"
                  : "bg-gradient-to-br from-[var(--surface)] to-[var(--card)] hover:from-[var(--border-light)] hover:to-[var(--surface)]"
              }`}
            >
              {/* Listra decorativa */}
              <div className="absolute left-0 top-0 h-full w-1 bg-[var(--accent)] opacity-60 transition-opacity group-hover:opacity-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{group.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {group.leaderName ? `Líder: ${group.leaderName}` : "Sem líder"}
                    </p>
                  </div>
                </div>
                {group.hasUnregisteredAttendance && (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                    <CalendarX className="h-4 w-4" />
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-[var(--bg)]/60 px-2 py-1.5">
                  <Users className="h-3 w-3 text-[var(--text-muted)]" />
                  <span className="text-xs font-medium">{group.memberCount}</span>
                </div>
                <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${isZeroAttendance ? "bg-amber-100/60 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" : "bg-[var(--bg)]/60"}`}>
                  <TrendingUp className="h-3 w-3 text-[var(--text-muted)]" />
                  <span className={`text-xs font-medium ${isZeroAttendance ? "text-amber-700 dark:text-amber-400" : ""}`}>{group.averageAttendance}%</span>
                </div>
                {group.atRiskCount > 0 ? (
                  <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1.5 dark:bg-red-950/20">
                    <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      {group.atRiskCount}
                    </span>
                  </div>
                ) : isZeroAttendance ? (
                  <div className="flex items-center gap-1.5 rounded-lg bg-amber-100/60 px-2 py-1.5 dark:bg-amber-950/20">
                    <TrendingUp className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">0%</span>
                  </div>
                ) : null}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
