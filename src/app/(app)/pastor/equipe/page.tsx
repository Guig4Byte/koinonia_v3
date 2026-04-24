"use client"

import { usePastorSupervisors } from "@/hooks/use-pastor-supervisors"
import { TrendingUp, AlertTriangle, ClipboardList, User } from "lucide-react"
import Link from "next/link"

export default function PastorEquipePage() {
  const { data, isLoading } = usePastorSupervisors()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--surface)]" />
        ))}
      </div>
    )
  }

  const supervisors = data?.supervisors ?? []

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-[var(--text-secondary)]">
        Equipe Pastoral
      </h2>

      {supervisors.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Nenhum supervisor cadastrado
          </p>
        </div>
      )}

      <div className="space-y-3">
        {supervisors.map((supervisor) => (
          <Link
            key={supervisor.id}
            href={`/pastor/equipe/${supervisor.id}`}
            className="flex flex-col gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--card)] p-4 transition hover:bg-[var(--surface)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{supervisor.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {supervisor.groupCount} célula{supervisor.groupCount !== 1 ? "s" : ""} ·{" "}
                  {supervisor.totalMembers} membro{supervisor.totalMembers !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-[var(--surface)] px-2 py-1.5">
                <TrendingUp className="h-3 w-3 text-[var(--text-muted)]" />
                <span className="text-xs font-medium">{supervisor.averageAttendance}%</span>
              </div>
              {supervisor.atRiskCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1.5 dark:bg-red-950/20">
                  <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    {supervisor.atRiskCount} em risco
                  </span>
                </div>
              )}
              {supervisor.overdueTasksCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 dark:bg-amber-950/20">
                  <ClipboardList className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {supervisor.overdueTasksCount} atras.
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
