"use client"

import Link from "next/link"
import {
  AlertTriangle,
  CalendarX,
  CheckCircle2,
  TrendingDown,
  Users,
} from "lucide-react"
import { ContextSignalList } from "@/components/features/context-signal-list"
import {
  useSupervisorGroups,
  type SupervisorGroup,
} from "@/hooks/use-supervisor-groups"

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function needsSupport(group: SupervisorGroup) {
  return (
    group.atRiskCount > 0 ||
    group.hasUnregisteredAttendance ||
    (group.lastAttendanceRate !== null && group.lastAttendanceRate < 70)
  )
}

function sortGroups(groups: SupervisorGroup[]) {
  return [...groups].sort((a, b) => {
    const aPriority = needsSupport(a) ? 0 : 1
    const bPriority = needsSupport(b) ? 0 : 1
    if (aPriority !== bPriority) return aPriority - bPriority

    if (b.atRiskCount !== a.atRiskCount) return b.atRiskCount - a.atRiskCount
    if (Number(b.hasUnregisteredAttendance) !== Number(a.hasUnregisteredAttendance)) {
      return Number(b.hasUnregisteredAttendance) - Number(a.hasUnregisteredAttendance)
    }

    const aAttendance = a.lastAttendanceRate ?? a.averageAttendance ?? 101
    const bAttendance = b.lastAttendanceRate ?? b.averageAttendance ?? 101
    return aAttendance - bAttendance
  })
}

function getGroupTone(group: SupervisorGroup) {
  if (group.atRiskCount > 0 || (group.lastAttendanceRate !== null && group.lastAttendanceRate < 60)) {
    return "risk" as const
  }

  if (group.hasUnregisteredAttendance || (group.lastAttendanceRate !== null && group.lastAttendanceRate < 70)) {
    return "warn" as const
  }

  return "ok" as const
}

function getGroupLabel(group: SupervisorGroup) {
  const tone = getGroupTone(group)
  if (tone === "risk") return "Prioridade"
  if (tone === "warn") return "Atenção"
  return "Estável"
}

function getGroupReading(group: SupervisorGroup) {
  const reasons: string[] = []

  if (group.atRiskCount > 0) {
    reasons.push(
      `${group.atRiskCount} ${pluralize(group.atRiskCount, "pessoa precisa", "pessoas precisam")} de cuidado`,
    )
  }

  if (group.hasUnregisteredAttendance) {
    reasons.push("presença pendente")
  }

  if (group.lastAttendanceRate !== null && group.lastAttendanceRate < 70) {
    reasons.push(`${group.lastAttendanceRate}% no último encontro`)
  }

  if (reasons.length === 0) {
    return "Sem alerta por agora."
  }

  return reasons.join(" · ")
}

function getGroupSignals(group: SupervisorGroup) {
  const signals: string[] = []

  if (group.atRiskCount > 0) {
    signals.push(
      `${group.atRiskCount} ${pluralize(group.atRiskCount, "pessoa precisa", "pessoas precisam")} de cuidado`,
    )
  }

  if (group.hasUnregisteredAttendance) {
    signals.push("Presença do encontro ainda pendente")
  }

  if (group.lastAttendanceRate !== null && group.lastAttendanceRate < 70) {
    signals.push(`Último encontro com ${group.lastAttendanceRate}% de presença`)
  }

  if (signals.length === 0) {
    signals.push("Sem alerta por agora")
  }

  return signals
}

const toneClasses = {
  risk: {
    card: "border-[var(--risk-border)] bg-[var(--risk-bg)]",
    icon: "bg-[var(--surface-soft)] text-[var(--risk)] dark:bg-black/10",
    badge: "bg-[var(--surface-soft)] text-[var(--risk)] dark:bg-black/10",
  },
  warn: {
    card: "border-[var(--warn-border)] bg-[var(--warn-bg)]",
    icon: "bg-[var(--surface-soft)] text-[var(--warn)] dark:bg-black/10",
    badge: "bg-[var(--surface-soft)] text-[var(--warn)] dark:bg-black/10",
  },
  ok: {
    card: "border-[var(--border-light)] bg-[var(--card)]",
    icon: "bg-[var(--ok-bg)] text-[var(--ok)]",
    badge: "bg-[var(--ok-bg)] text-[var(--ok)]",
  },
}

function GroupCard({ group }: { group: SupervisorGroup }) {
  const tone = getGroupTone(group)
  const classes = toneClasses[tone]

  return (
    <Link
      href={`/supervisor/celulas/${group.id}`}
      className={`block rounded-2xl border p-4 transition hover:bg-[var(--surface)] active:scale-[0.98] ${classes.card}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${classes.icon}`}>
          {group.hasUnregisteredAttendance ? (
            <CalendarX className="h-5 w-5" />
          ) : tone === "ok" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <TrendingDown className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {group.name}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {group.leaderName ? `Líder: ${group.leaderName}` : "Sem líder definido"} · {group.memberCount} membros
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${classes.badge}`}>
              {getGroupLabel(group)}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {getGroupReading(group)}
          </p>

          <ContextSignalList
            signals={getGroupSignals(group)}
            tone={tone === "risk" ? "risk" : tone === "warn" ? "warn" : "neutral"}
            className="mt-3"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--surface-soft)] px-2 py-1 text-[0.65rem] font-medium text-[var(--text-secondary)] dark:bg-black/10">
              {group.averageAttendance}% média
            </span>
            {group.lastAttendanceRate !== null && (
              <span className="rounded-full bg-[var(--surface-soft)] px-2 py-1 text-[0.65rem] font-medium text-[var(--text-secondary)] dark:bg-black/10">
                {group.lastAttendanceRate}% último encontro
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function SupervisorCelulasPage() {
  const { data, isLoading } = useSupervisorGroups()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--surface)]" />
        ))}
      </div>
    )
  }

  const groups = sortGroups(data?.groups ?? [])
  const supportGroups = groups.filter(needsSupport)
  const stableGroups = groups.filter((group) => !needsSupport(group))

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Células
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
          Onde preciso apoiar?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Comece pelas células que pedem apoio do líder.
        </p>
      </section>

      {groups.length === 0 && (
        <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-6 text-center">
          <Users className="mx-auto h-6 w-6 text-[var(--text-muted)]" />
          <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
            Nenhuma célula supervisionada
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            Quando houver células na sua região, elas aparecerão aqui.
          </p>
        </section>
      )}

      {supportGroups.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[var(--warn)]">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Pedem apoio</h3>
            </div>
            <span className="rounded-full bg-[var(--warn-bg)] px-2 py-1 text-xs font-semibold text-[var(--warn)]">
              {supportGroups.length}
            </span>
          </div>
          {supportGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </section>
      )}

      {stableGroups.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[var(--ok)]">
            <CheckCircle2 className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Estáveis por agora</h3>
          </div>
          {stableGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </section>
      )}
    </div>
  )
}
