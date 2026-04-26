"use client"

import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Search,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  usePastorDashboard,
  type PastorDashboardGroup,
} from "@/hooks/use-pastor-dashboard"
import { SummaryCard } from "@/components/pastor/summary-card"
import { AlertCard } from "@/components/pastor/alert-card"
import { GroupCard } from "@/components/pastor/group-card"

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function isGroupInAttention(group: PastorDashboardGroup) {
  return (
    group.atRiskCount > 0 ||
    (group.lastAttendanceRate !== null && group.lastAttendanceRate < 60)
  )
}

function getAttendanceAccent(attendance: number) {
  if (attendance < 50) return "risk"
  if (attendance >= 80) return "ok"
  return "default"
}

function getSupervisorFocus(groups: PastorDashboardGroup[]) {
  const counts = new Map<string, number>()

  groups.forEach((group) => {
    const supervisor = group.supervisorName ?? "Supervisão sem nome"
    counts.set(supervisor, (counts.get(supervisor) ?? 0) + 1)
  })

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)[0]
}

function sortGroupsForPastor(groups: PastorDashboardGroup[]) {
  return [...groups].sort((a, b) => {
    if (b.atRiskCount !== a.atRiskCount) {
      return b.atRiskCount - a.atRiskCount
    }

    const aAttendance = a.lastAttendanceRate ?? 101
    const bAttendance = b.lastAttendanceRate ?? 101
    return aAttendance - bAttendance
  })
}

export default function PastorPage() {
  const { data, isLoading } = usePastorDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-36 animate-pulse rounded-2xl bg-[var(--surface)]" />
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

  const atRiskCount = summary?.atRiskCount ?? 0
  const overdueTasksCount = summary?.overdueTasksCount ?? 0
  const averageAttendance = summary?.averageAttendance ?? 0
  const attentionGroups = sortGroupsForPastor(groups.filter(isGroupInAttention))
  const supervisorFocus = getSupervisorFocus(attentionGroups)
  const relevantAlerts = alerts.slice(0, 4)

  const mainPulse =
    atRiskCount > 0
      ? `${atRiskCount} ${pluralize(atRiskCount, "pessoa precisa", "pessoas precisam")} de cuidado esta semana.`
      : attentionGroups.length > 0
        ? `${attentionGroups.length} ${pluralize(attentionGroups.length, "célula pede", "células pedem")} atenção pastoral.`
        : "A igreja está estável por agora."

  const supportPulse = supervisorFocus
    ? `${supervisorFocus.name} concentra ${supervisorFocus.count} ${pluralize(
        supervisorFocus.count,
        "frente sensível",
        "frentes sensíveis",
      )}.`
    : overdueTasksCount > 0
      ? `${overdueTasksCount} ${pluralize(
          overdueTasksCount,
          "ação de cuidado atrasada pede",
          "ações de cuidado atrasadas pedem",
        )} revisão.`
      : "Nenhum sinal urgente pedindo intervenção imediata."

  return (
    <div className="space-y-6">
      <section className="rounded-2xl p-5 text-white shadow-lg" style={{ backgroundColor: "var(--pulse-card-bg)" }}>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-white/70">
          Leitura pastoral de agora
        </p>
        <h2 className="text-2xl font-semibold leading-snug text-white">
          {mainPulse}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/70">{supportPulse}</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="Pessoas em risco"
          value={atRiskCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent={atRiskCount > 0 ? "risk" : "ok"}
        />
        <SummaryCard
          label="Células sensíveis"
          value={attentionGroups.length}
          icon={<Users className="h-5 w-5" />}
          accent={attentionGroups.length > 0 ? "risk" : "ok"}
        />
        <SummaryCard
          label="Presença dos encontros"
          value={`${averageAttendance}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          accent={getAttendanceAccent(averageAttendance)}
        />
        <SummaryCard
          label="Ações atrasadas"
          value={overdueTasksCount}
          icon={<ClipboardList className="h-5 w-5" />}
          accent={overdueTasksCount > 0 ? "risk" : "ok"}
        />
      </section>

      <p className="-mt-3 text-xs leading-5 text-[var(--text-muted)]">
        Presença dos encontros é a média das presenças registradas nas células.
        Pessoas em risco, células sensíveis e ações atrasadas mostram onde o
        cuidado pastoral precisa de atenção agora.
      </p>

      <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
            <Search className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Precisa responder alguém no corredor?
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              Use a busca pastoral para achar pessoa, célula ou líder e entender o contexto em segundos.
            </p>
            <Link
              href="/pastor/busca"
              className="mt-3 inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Buscar agora
            </Link>
          </div>
        </div>
      </section>

      {relevantAlerts.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">
              Sinais que explicam a leitura
            </h2>
          </div>
          <div className="space-y-2">
            {relevantAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-4">
          <div className="flex items-start gap-3 text-[var(--ok)]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold">Sem sinais críticos agora</h2>
              <p className="mt-1 text-sm leading-6">
                Acompanhe a equipe, mas não há uma urgência pastoral pedindo intervenção imediata.
              </p>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">
            Onde olhar com calma
          </h2>
          <Link href="/pastor/equipe" className="text-xs font-medium text-[var(--accent)]">
            Ver equipe
          </Link>
        </div>
        {attentionGroups.length > 0 ? (
          <div className="space-y-2">
            {attentionGroups.slice(0, 4).map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Nenhuma célula concentrando risco neste momento.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
