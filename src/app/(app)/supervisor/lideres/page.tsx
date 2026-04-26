"use client"

import Link from "next/link"
import {
  AlertTriangle,
  CalendarX,
  CheckCircle2,
  ClipboardList,
  User,
} from "lucide-react"
import { ContextSignalList } from "@/components/features/context-signal-list"
import {
  useSupervisorGroups,
  type SupervisorGroup,
} from "@/hooks/use-supervisor-groups"

interface LeaderSummary {
  name: string
  groups: SupervisorGroup[]
  memberCount: number
  atRiskCount: number
  pendingAttendanceCount: number
  averageAttendance: number | null
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function buildLeaderSummaries(groups: SupervisorGroup[]): LeaderSummary[] {
  const map = new Map<string, LeaderSummary>()

  groups.forEach((group) => {
    const name = group.leaderName ?? "Sem líder definido"
    const current = map.get(name) ?? {
      name,
      groups: [],
      memberCount: 0,
      atRiskCount: 0,
      pendingAttendanceCount: 0,
      averageAttendance: null,
    }

    current.groups.push(group)
    current.memberCount += group.memberCount
    current.atRiskCount += group.atRiskCount
    current.pendingAttendanceCount += group.hasUnregisteredAttendance ? 1 : 0
    map.set(name, current)
  })

  return [...map.values()]
    .map((leader) => {
      const groupsWithAttendance = leader.groups.filter(
        (group) => group.lastAttendanceRate !== null,
      )
      const averageAttendance = groupsWithAttendance.length
        ? Math.round(
            groupsWithAttendance.reduce(
              (sum, group) => sum + (group.lastAttendanceRate ?? 0),
              0,
            ) / groupsWithAttendance.length,
          )
        : null

      return { ...leader, averageAttendance }
    })
    .sort((a, b) => {
      if (b.atRiskCount !== a.atRiskCount) return b.atRiskCount - a.atRiskCount
      if (b.pendingAttendanceCount !== a.pendingAttendanceCount) {
        return b.pendingAttendanceCount - a.pendingAttendanceCount
      }

      const aAttendance = a.averageAttendance ?? 101
      const bAttendance = b.averageAttendance ?? 101
      return aAttendance - bAttendance
    })
}

function getLeaderTone(leader: LeaderSummary) {
  if (leader.atRiskCount > 0 || (leader.averageAttendance !== null && leader.averageAttendance < 60)) {
    return "risk" as const
  }

  if (leader.pendingAttendanceCount > 0 || (leader.averageAttendance !== null && leader.averageAttendance < 70)) {
    return "warn" as const
  }

  return "ok" as const
}

function getLeaderStatus(leader: LeaderSummary) {
  const tone = getLeaderTone(leader)

  if (tone === "risk") {
    return {
      label: "Prioridade",
      className: "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]",
    }
  }

  if (tone === "warn") {
    return {
      label: "Apoiar",
      className: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
    }
  }

  return {
    label: "Estável",
    className: "border-[var(--ok-border)] bg-[var(--ok-bg)] text-[var(--ok)]",
  }
}

function getLeaderReading(leader: LeaderSummary) {
  const reasons: string[] = []

  if (leader.atRiskCount > 0) {
    reasons.push(
      `${leader.atRiskCount} ${pluralize(
        leader.atRiskCount,
        "pessoa precisa",
        "pessoas precisam",
      )} de cuidado`,
    )
  }

  if (leader.pendingAttendanceCount > 0) {
    reasons.push(
      `${leader.pendingAttendanceCount} ${pluralize(
        leader.pendingAttendanceCount,
        "célula com presença pendente",
        "células com presença pendente",
      )}`,
    )
  }

  if (leader.averageAttendance !== null && leader.averageAttendance < 70) {
    reasons.push(`${leader.averageAttendance}% de presença média`)
  }

  if (reasons.length === 0) {
    return "Sem alerta para a supervisão agora."
  }

  return reasons.join(" · ")
}

function getLeaderSignals(leader: LeaderSummary) {
  const signals: string[] = []

  if (leader.atRiskCount > 0) {
    signals.push(
      `${leader.atRiskCount} ${pluralize(leader.atRiskCount, "pessoa precisa", "pessoas precisam")} de cuidado`,
    )
  }

  if (leader.pendingAttendanceCount > 0) {
    signals.push(
      `${leader.pendingAttendanceCount} ${pluralize(
        leader.pendingAttendanceCount,
        "célula com presença pendente",
        "células com presença pendente",
      )}`,
    )
  }

  if (leader.averageAttendance !== null && leader.averageAttendance < 70) {
    signals.push(`Presença média de ${leader.averageAttendance}%`)
  }

  if (signals.length === 0) {
    signals.push("Sem alerta para a supervisão agora")
  }

  return signals
}

function getLeaderNextStep(leader: LeaderSummary) {
  if (leader.atRiskCount > 0) {
    return "Pergunte quem precisa de cuidado e combine retorno."
  }

  if (leader.pendingAttendanceCount > 0) {
    return "Peça atualização do encontro antes de novas cobranças."
  }

  if (leader.averageAttendance !== null && leader.averageAttendance < 70) {
    return "Entenda se a queda é pontual ou se o líder precisa de ajuda."
  }

  return "Mantenha proximidade normal nos próximos encontros."
}

function LeaderCard({ leader }: { leader: LeaderSummary }) {
  const status = getLeaderStatus(leader)
  const firstGroup = leader.groups[0]
  const tone = getLeaderTone(leader)

  return (
    <Link
      href={firstGroup ? `/supervisor/celulas/${firstGroup.id}` : "/supervisor/celulas"}
      className={`block rounded-2xl border p-4 transition hover:bg-[var(--surface)] active:scale-[0.98] ${
        tone === "risk"
          ? "border-[var(--risk-border)] bg-[var(--risk-bg)]"
          : tone === "warn"
            ? "border-[var(--warn-border)] bg-[var(--warn-bg)]"
            : "border-[var(--border-light)] bg-[var(--card)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            tone === "risk"
              ? "bg-[var(--surface-soft)] text-[var(--risk)] dark:bg-black/10"
              : tone === "warn"
                ? "bg-[var(--surface-soft)] text-[var(--warn)] dark:bg-black/10"
                : "bg-[var(--ok-bg)] text-[var(--ok)]"
          }`}
        >
          <User className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {leader.name}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {leader.groups.length} {pluralize(leader.groups.length, "célula", "células")} · {leader.memberCount} membros
              </p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${status.className}`}>
              {status.label}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {getLeaderReading(leader)}
          </p>
          <ContextSignalList
            signals={getLeaderSignals(leader)}
            tone={tone === "risk" ? "risk" : tone === "warn" ? "warn" : "neutral"}
            className="mt-3"
          />
          <p className="mt-3 text-xs font-semibold text-[var(--accent)]">
            {getLeaderNextStep(leader)}
          </p>

          {leader.groups.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {leader.groups.slice(0, 3).map((group) => (
                <span
                  key={group.id}
                  className="rounded-full bg-[var(--surface-soft)] px-2 py-1 text-[0.65rem] font-medium text-[var(--text-secondary)] dark:bg-black/10"
                >
                  {group.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function SupervisorLideresPage() {
  const { data, isLoading } = useSupervisorGroups()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-[var(--surface)]" />
        ))}
      </div>
    )
  }

  const groups = data?.groups ?? []
  const leaders = buildLeaderSummaries(groups)
  const leadersNeedingSupport = leaders.filter((leader) => getLeaderTone(leader) !== "ok")

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Líderes
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
          Quem precisa de suporte?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Veja líderes com pessoas em cuidado, presença pendente ou queda nos encontros.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <User className="h-4 w-4" />
            <p className="text-xs font-medium">Líderes</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {leaders.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--warn-border)] bg-[var(--warn-bg)] p-4">
          <div className="flex items-center gap-2 text-[var(--warn)]">
            <ClipboardList className="h-4 w-4" />
            <p className="text-xs font-medium">Precisam de apoio</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {leadersNeedingSupport.length}
          </p>
        </div>
      </section>

      {leaders.length > 0 ? (
        <section className="space-y-3">
          {leaders.map((leader) => (
            <LeaderCard key={leader.name} leader={leader} />
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-4">
          <div className="flex items-start gap-3 text-[var(--ok)]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold">Nenhum líder encontrado</h3>
              <p className="mt-1 text-sm leading-6">
                Quando houver células supervisionadas, os líderes aparecerão aqui.
              </p>
            </div>
          </div>
        </section>
      )}

      {leadersNeedingSupport.length > 0 && (
        <section className="rounded-2xl border border-[var(--warn-border)] bg-[var(--warn-bg)] p-4">
          <div className="flex items-start gap-3 text-[var(--warn)]">
            {leadersNeedingSupport.some((leader) => leader.pendingAttendanceCount > 0) ? (
              <CalendarX className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div>
              <h3 className="text-sm font-semibold">Comece pelo líder com maior carga</h3>
              <p className="mt-1 text-sm leading-6">
                Um contato breve pode aliviar o líder e ajudar a célula inteira.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
