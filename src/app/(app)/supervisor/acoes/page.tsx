"use client"

import Link from "next/link"
import { AlertTriangle, CheckCircle2, ClipboardList, User } from "lucide-react"
import {
  useSupervisorDashboard,
  type SupervisorDashboardAlert,
  type SupervisorDashboardGroup,
} from "@/hooks/use-supervisor-dashboard"
import { cn } from "@/lib/utils"

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function isGroupInAttention(group: SupervisorDashboardGroup) {
  return (
    group.atRiskCount > 0 ||
    (group.lastAttendanceRate !== null && group.lastAttendanceRate < 70)
  )
}

function getAlertHref(alert: SupervisorDashboardAlert) {
  if (alert.personId) return `/membro/${alert.personId}`
  if (alert.groupId) return `/supervisor/celulas/${alert.groupId}`
  return undefined
}

function getSeverityClasses(severity: SupervisorDashboardAlert["severity"]) {
  if (severity === "high") {
    return "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]"
  }

  if (severity === "medium") {
    return "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]"
  }

  return "border-[var(--new-border)] bg-[var(--new-bg)] text-[var(--new)]"
}

function getActionLabel(alert: SupervisorDashboardAlert) {
  if (alert.severity === "high") return "Prioridade"
  if (alert.severity === "medium") return "Esta semana"
  return "Observar"
}

function ActionFromAlert({ alert }: { alert: SupervisorDashboardAlert }) {
  const href = getAlertHref(alert)
  const content = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-[var(--surface-soft)] dark:bg-black/10",
          getSeverityClasses(alert.severity),
        )}
      >
        <ClipboardList className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {alert.title}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide",
              getSeverityClasses(alert.severity),
            )}
          >
            {getActionLabel(alert)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {alert.description}
        </p>
        {(alert.personName || alert.groupName) && (
          <p className="mt-2 text-xs font-medium text-[var(--accent)]">
            Abra {alert.personName ?? alert.groupName} e combine o cuidado.
          </p>
        )}
      </div>
    </>
  )

  const className =
    "flex items-start gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 transition hover:bg-[var(--surface)] active:scale-[0.98]"

  if (!href) return <div className={className}>{content}</div>

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}

function GroupActionCard({ group }: { group: SupervisorDashboardGroup }) {
  const reasons: string[] = []

  if (group.atRiskCount > 0) {
    reasons.push(
      `${group.atRiskCount} ${pluralize(group.atRiskCount, "pessoa precisa", "pessoas precisam")} de cuidado`,
    )
  }

  if (group.lastAttendanceRate !== null && group.lastAttendanceRate < 70) {
    reasons.push(`${group.lastAttendanceRate}% no último encontro`)
  }

  const isRisk = group.atRiskCount > 0 || (group.lastAttendanceRate !== null && group.lastAttendanceRate < 60)

  return (
    <Link
      href={`/supervisor/celulas/${group.id}`}
      className={`flex items-start gap-3 rounded-2xl border p-4 transition hover:opacity-90 active:scale-[0.98] ${
        isRisk
          ? "border-[var(--risk-border)] bg-[var(--risk-bg)]"
          : "border-[var(--warn-border)] bg-[var(--warn-bg)]"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] dark:bg-black/10 ${
          isRisk ? "text-[var(--risk)]" : "text-[var(--warn)]"
        }`}
      >
        <User className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Falar com {group.leaderName ?? "o líder"} sobre {group.name}
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
          {reasons.length > 0 ? reasons.join(" · ") : "Acompanhe a célula esta semana."}
        </p>
        <p className="mt-2 text-xs font-semibold text-[var(--accent)]">
          Combine uma ação simples e registre o retorno.
        </p>
      </div>
    </Link>
  )
}

export default function SupervisorAcoesPage() {
  const { data, isLoading } = useSupervisorDashboard()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-[var(--surface)]" />
        ))}
      </div>
    )
  }

  const alerts = data?.alerts ?? []
  const groups = data?.groups ?? []
  const attentionGroups = groups.filter(isGroupInAttention)
  const urgentAlerts = alerts.filter((alert) => alert.severity === "high")
  const weekAlerts = alerts.filter((alert) => alert.severity !== "high")
  const fallbackGroupActions = alerts.length === 0 ? attentionGroups.slice(0, 3) : []
  const totalActions = urgentAlerts.length + weekAlerts.length + fallbackGroupActions.length

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Ações
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
          O que precisa voltar?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Uma fila curta para apoiar líderes e acompanhar células.
        </p>
      </section>

      {totalActions > 0 && (
        <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--accent)]">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {totalActions} {pluralize(totalActions, "cuidado aberto", "cuidados abertos")}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                Comece pelos prioritários e registre quando houver contato.
              </p>
            </div>
          </div>
        </section>
      )}

      {urgentAlerts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[var(--risk)]">
            <AlertTriangle className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Prioridade</h3>
          </div>
          {urgentAlerts.map((alert) => (
            <ActionFromAlert key={alert.id} alert={alert} />
          ))}
        </section>
      )}

      {weekAlerts.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
            Para esta semana
          </h3>
          {weekAlerts.map((alert) => (
            <ActionFromAlert key={alert.id} alert={alert} />
          ))}
        </section>
      )}

      {fallbackGroupActions.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
            Sugestões de apoio
          </h3>
          {fallbackGroupActions.map((group) => (
            <GroupActionCard key={group.id} group={group} />
          ))}
        </section>
      )}

      {totalActions === 0 && (
        <section className="rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-4">
          <div className="flex items-start gap-3 text-[var(--ok)]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold">Nada prioritário agora</h3>
              <p className="mt-1 text-sm leading-6">
                A região não tem cuidado aberto. Siga perto dos líderes.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
