"use client"

import { useSupervisorDashboard } from "@/hooks/use-supervisor-dashboard"
import { SummaryCard } from "@/components/pastor/summary-card"
import { AlertCard } from "@/components/pastor/alert-card"
import { GroupCard } from "@/components/pastor/group-card"
import { Users, User, TrendingUp, AlertTriangle } from "lucide-react"

export default function SupervisorPage() {
  const { data, isLoading } = useSupervisorDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    )
  }

  const summary = data?.summary
  const alerts = data?.alerts ?? []
  const groups = data?.groups ?? []

  return (
    <div className="space-y-6">
      {/* Resumo da Região */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
          Minha Região
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="Células"
            value={summary?.totalGroups ?? 0}
            icon={<Users className="h-5 w-5" />}
          />
          <SummaryCard
            label="Membros"
            value={summary?.totalMembers ?? 0}
            icon={<User className="h-5 w-5" />}
          />
          <SummaryCard
            label="Presença Média"
            value={`${summary?.averageAttendance ?? 0}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            accent={
              (summary?.averageAttendance ?? 0) < 50
                ? "risk"
                : (summary?.averageAttendance ?? 0) >= 80
                ? "ok"
                : "default"
            }
          />
          <SummaryCard
            label="Em Risco"
            value={summary?.atRiskCount ?? 0}
            icon={<AlertTriangle className="h-5 w-5" />}
            accent={
              (summary?.atRiskCount ?? 0) > 0 ? "risk" : "default"
            }
          />
        </div>
      </section>

      {/* Alertas */}
      {alerts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
            Alertas
          </h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      )}

      {/* Ranking de Células */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
          Células
        </h2>
        <div className="space-y-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </section>
    </div>
  )
}
