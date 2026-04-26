"use client"

import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  TrendingDown,
  Users,
  User,
} from "lucide-react"
import {
  useSupervisorDashboard,
  type SupervisorDashboardGroup,
} from "@/hooks/use-supervisor-dashboard"
import { SummaryCard } from "@/components/pastor/summary-card"

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function isGroupInAttention(group: SupervisorDashboardGroup) {
  return (
    group.atRiskCount > 0 ||
    (group.lastAttendanceRate !== null && group.lastAttendanceRate < 70)
  )
}

function sortGroupsForSupervisor(groups: SupervisorDashboardGroup[]) {
  return [...groups].sort((a, b) => {
    if (b.atRiskCount !== a.atRiskCount) return b.atRiskCount - a.atRiskCount

    const aAttendance = a.lastAttendanceRate ?? 101
    const bAttendance = b.lastAttendanceRate ?? 101
    return aAttendance - bAttendance
  })
}

function getLeaderFocus(groups: SupervisorDashboardGroup[]) {
  return groups.find((group) => group.leaderName)?.leaderName ?? null
}

function getGroupReading(group: SupervisorDashboardGroup) {
  const reasons: string[] = []

  if (group.atRiskCount > 0) {
    reasons.push(
      `${group.atRiskCount} ${pluralize(group.atRiskCount, "pessoa precisa", "pessoas precisam")} de cuidado`,
    )
  }

  if (group.lastAttendanceRate !== null && group.lastAttendanceRate < 70) {
    reasons.push(`${group.lastAttendanceRate}% no último encontro`)
  }

  return reasons.length > 0 ? reasons.join(" · ") : "Acompanhar a próxima leitura da célula"
}

function getAttendanceAccent(attendance: number) {
  if (attendance < 60) return "risk"
  if (attendance >= 80) return "ok"
  return "default"
}

function SupportCard({ group }: { group: SupervisorDashboardGroup }) {
  const isRisk = group.atRiskCount > 0 || (group.lastAttendanceRate !== null && group.lastAttendanceRate < 60)

  return (
    <Link
      href={`/supervisor/celulas/${group.id}`}
      className="block rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 transition hover:bg-[var(--surface)] active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isRisk ? "bg-[var(--risk-bg)] text-[var(--risk)]" : "bg-[var(--warn-bg)] text-[var(--warn)]"
          }`}
        >
          <TrendingDown className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {group.name}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {group.leaderName ? `Líder: ${group.leaderName}` : "Sem líder definido"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${
                isRisk ? "bg-[var(--risk-bg)] text-[var(--risk)]" : "bg-[var(--warn-bg)] text-[var(--warn)]"
              }`}
            >
              {isRisk ? "Prioridade" : "Apoiar"}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {getGroupReading(group)}.
          </p>
          <p className="mt-2 text-xs font-medium text-[var(--accent)]">
            Próximo passo: alinhar com {group.leaderName ?? "o líder"} um cuidado simples.
          </p>
        </div>
      </div>
    </Link>
  )
}

function QuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 transition hover:bg-[var(--surface)] active:scale-[0.98]"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--accent)]">
        {icon}
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{description}</p>
    </Link>
  )
}

export default function SupervisorPage() {
  const { data, isLoading } = useSupervisorDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-36 animate-pulse rounded-2xl bg-[var(--surface)]" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    )
  }

  const summary = data?.summary
  const groups = data?.groups ?? []

  const atRiskCount = summary?.atRiskCount ?? 0
  const overdueTasksCount = summary?.overdueTasksCount ?? 0
  const averageAttendance = summary?.averageAttendance ?? 0
  const attentionGroups = sortGroupsForSupervisor(groups.filter(isGroupInAttention))
  const leaderFocus = getLeaderFocus(attentionGroups)

  const mainPulse =
    attentionGroups.length > 0
      ? `${attentionGroups.length} ${pluralize(attentionGroups.length, "célula precisa", "células precisam")} de apoio esta semana.`
      : atRiskCount > 0
        ? `${atRiskCount} ${pluralize(atRiskCount, "pessoa precisa", "pessoas precisam")} de cuidado mais próximo.`
        : "Sua região está estável por agora."

  const supportPulse = leaderFocus
    ? `${leaderFocus} é o primeiro líder para acompanhar.`
    : overdueTasksCount > 0
      ? `${overdueTasksCount} ${pluralize(overdueTasksCount, "ação atrasada", "ações atrasadas")} pedem revisão com os líderes.`
      : "Mantenha proximidade com os líderes e acompanhe os próximos encontros."

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl p-5 text-white shadow-lg"
        style={{ backgroundColor: "var(--pulse-card-bg)" }}
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-white/70">
          Região em cuidado
        </p>
        <h2 className="text-2xl font-semibold leading-snug text-white">
          {mainPulse}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/70">{supportPulse}</p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <QuickLink
          href="/supervisor/celulas"
          title="Células"
          description="Ver onde a região pede atenção."
          icon={<Users className="h-5 w-5" />}
        />
        <QuickLink
          href="/supervisor/lideres"
          title="Líderes"
          description="Apoiar quem está carregando cuidado."
          icon={<User className="h-5 w-5" />}
        />
        <QuickLink
          href="/supervisor/acoes"
          title="Ações"
          description="Encaminhar o que não pode esperar."
          icon={<ClipboardList className="h-5 w-5" />}
        />
      </section>

      {attentionGroups.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">
              Comece por aqui
            </h2>
            <Link href="/supervisor/celulas" className="text-xs font-medium text-[var(--accent)]">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {attentionGroups.slice(0, 3).map((group) => (
              <SupportCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-4">
          <div className="flex items-start gap-3 text-[var(--ok)]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold">Sem célula pedindo apoio urgente</h2>
              <p className="mt-1 text-sm leading-6">
                A região está tranquila. Continue perto dos líderes e observe os próximos encontros.
              </p>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
          Resumo da região
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="Células"
            value={summary?.totalGroups ?? 0}
            icon={<Users className="h-5 w-5" />}
          />
          <SummaryCard
            label="Pessoas em risco"
            value={atRiskCount}
            icon={<AlertTriangle className="h-5 w-5" />}
            accent={atRiskCount > 0 ? "risk" : "ok"}
          />
          <SummaryCard
            label="Presença média"
            value={`${averageAttendance}%`}
            icon={<TrendingDown className="h-5 w-5" />}
            accent={getAttendanceAccent(averageAttendance)}
          />
          <SummaryCard
            label="Ações atrasadas"
            value={overdueTasksCount}
            icon={<ClipboardList className="h-5 w-5" />}
            accent={overdueTasksCount > 0 ? "risk" : "ok"}
          />
        </div>
      </section>
    </div>
  )
}
