"use client"

import { PulseCard } from "@/components/features/pulse-card"
import { MemberCard } from "@/components/features/member-card"
import { RiskBadge } from "@/components/features/risk-badge"
import { useLeaderDashboard } from "@/hooks/use-leader-dashboard"
import { Loader2 } from "lucide-react"

function riskPriority(level: string | null): number {
  if (level === "red") return 0
  if (level === "yellow") return 1
  if (level === "green") return 2
  return 3
}

export default function LiderPage() {
  const { data, isLoading, isError } = useLeaderDashboard()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <p className="text-[var(--text-secondary)]">Erro ao carregar dados.</p>
        <p className="text-sm text-[var(--text-muted)]">
          Tente recarregar a página.
        </p>
      </div>
    )
  }

  const urgentMembers = [...data.members]
    .sort((a, b) => riskPriority(a.riskLevel) - riskPriority(b.riskLevel))
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      {/* Saudação */}
      <div className="opacity-0 animate-fade-up">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          {data.group.name}
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          {data.summary.totalMembers} membros
        </p>
      </div>

      {/* Pulse Card */}
      <div
        className="opacity-0 animate-fade-up"
        style={{ animationDelay: "150ms" }}
      >
        <PulseCard
          totalMembers={data.summary.totalMembers}
          lastAttendanceRate={data.summary.lastAttendanceRate}
          atRiskCount={data.summary.atRiskCount}
        />
      </div>

      {/* Membros urgentes */}
      <div
        className="flex flex-col gap-3 opacity-0 animate-fade-up"
        style={{ animationDelay: "300ms" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Precisam de atenção
          </h3>
          {data.summary.atRiskCount > 0 ? (
            <RiskBadge
              level={
                data.summary.atRiskCount >= 3
                  ? "risk"
                  : data.summary.atRiskCount >= 1
                    ? "warn"
                    : "ok"
              }
            />
          ) : null}
        </div>

        {urgentMembers.length > 0 ? (
          <div className="flex flex-col gap-3">
            {urgentMembers.map((member) => (
              <MemberCard
                key={member.id}
                id={member.id}
                name={member.name}
                status={member.role === "host" ? "Anfitrião" : "Membro"}
                riskLevel={
                  member.riskLevel === "red"
                    ? "risk"
                    : member.riskLevel === "yellow"
                      ? "warn"
                      : member.riskLevel === "green"
                        ? "ok"
                        : undefined
                }
                note={member.lastInteraction ?? undefined}
                avatarUrl={member.photoUrl}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Todos os membros estão bem. 🙌
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
