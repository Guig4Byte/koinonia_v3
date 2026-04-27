"use client"

import { useParams, useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  TrendingUp,
  User,
  Users,
} from "lucide-react"
import { GroupCard } from "@/components/pastor/group-card"
import {
  useSupervisorProfile,
  type SupervisorProfileGroup,
} from "@/hooks/use-supervisor-profile"
import { cn } from "@/lib/utils"

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function getGroupScore(group: SupervisorProfileGroup) {
  const attendancePressure =
    group.lastAttendanceRate !== null ? Math.max(0, 70 - group.lastAttendanceRate) : 0

  return group.atRiskCount * 5 + attendancePressure
}

function shouldHighlightGroup(group: SupervisorProfileGroup) {
  return (
    group.atRiskCount > 0 ||
    (group.lastAttendanceRate !== null && group.lastAttendanceRate < 70)
  )
}

function getPastoralReading({
  sensitiveGroupCount,
  totalCarePeople,
  overdueCount,
}: {
  sensitiveGroupCount: number
  totalCarePeople: number
  overdueCount: number
}) {
  if (totalCarePeople > 0) {
    return {
      tone: "risk" as const,
      title: `${totalCarePeople} ${pluralize(totalCarePeople, "caso pede", "casos pedem")} atenção pastoral`,
      description:
        "Apoie a supervisão nos casos qualificados. A operação cotidiana continua com os líderes.",
    }
  }

  if (overdueCount > 0 || sensitiveGroupCount > 0) {
    return {
      tone: "warn" as const,
      title: `${sensitiveGroupCount || overdueCount} ${pluralize(sensitiveGroupCount || overdueCount, "ponto merece", "pontos merecem")} acompanhamento`,
      description:
        "Há retorno vencido ou padrão de presença para observar. Entre para entender antes de agir.",
    }
  }

  return {
    tone: "ok" as const,
    title: "Supervisão estável agora",
    description:
      "Nenhuma célula desta supervisão pede apoio pastoral específico neste momento.",
  }
}

const readingClasses = {
  risk: "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]",
  warn: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
  ok: "border-[var(--ok-border)] bg-[var(--ok-bg)] text-[var(--ok)]",
}

export default function SupervisorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data, isLoading } = useSupervisorProfile(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-[var(--surface)]" />
        <div className="h-32 animate-pulse rounded-xl bg-[var(--surface)]" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    )
  }

  const supervisor = data?.supervisor
  const groups = data?.groups ?? []
  const overdueTasks = data?.overdueTasks ?? []
  const totalMembers = groups.reduce((sum, group) => sum + group.memberCount, 0)
  const totalCarePeople = groups.reduce((sum, group) => sum + group.atRiskCount, 0)
  const averageAttendance =
    groups.length > 0
      ? Math.round(groups.reduce((sum, group) => sum + group.averageAttendance, 0) / groups.length)
      : 0
  const sortedGroups = [...groups].sort((a, b) => getGroupScore(b) - getGroupScore(a))
  const highlightedGroups = sortedGroups.filter(shouldHighlightGroup)
  const stableGroups = sortedGroups.filter((group) => !shouldHighlightGroup(group))
  const sensitiveGroupCount = highlightedGroups.length
  const reading = getPastoralReading({
    sensitiveGroupCount,
    totalCarePeople,
    overdueCount: overdueTasks.length,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.replace("/pastor/equipe")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)]">
          <User className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-[var(--text-primary)]">
            {supervisor?.name ?? "Supervisão"}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Supervisão pastoral
          </p>
        </div>
      </div>

      <section className={cn("rounded-3xl border p-5", readingClasses[reading.tone])}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-current dark:bg-black/10">
            {reading.tone === "ok" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <HeartHandshake className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-current opacity-80">
              Leitura pastoral da equipe
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-[var(--text-primary)]">
              {reading.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {reading.description}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-3 text-center">
          <Users className="mx-auto mb-1 h-4 w-4 text-[var(--text-muted)]" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {groups.length}
          </p>
          <p className="text-[0.65rem] text-[var(--text-muted)]">células</p>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-3 text-center",
            totalCarePeople > 0
              ? "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]"
              : "border-[var(--border-light)] bg-[var(--card)] text-[var(--text-muted)]",
          )}
        >
          <HeartHandshake className="mx-auto mb-1 h-4 w-4" />
          <p className="text-sm font-semibold">{totalCarePeople}</p>
          <p className="text-[0.65rem]">casos</p>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-3 text-center",
            averageAttendance < 70 && totalMembers > 0
              ? "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]"
              : "border-[var(--border-light)] bg-[var(--card)] text-[var(--text-muted)]",
          )}
        >
          <TrendingUp className="mx-auto mb-1 h-4 w-4" />
          <p className="text-sm font-semibold">{averageAttendance}%</p>
          <p className="text-[0.65rem]">presença</p>
        </div>
      </section>

      {overdueTasks.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
            Retornos que pedem atenção
          </h2>
          <p className="mb-3 text-xs leading-5 text-[var(--text-muted)]">
            Use como contexto para apoiar a supervisão; não como fila de cobrança administrativa.
          </p>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 rounded-xl border border-[var(--warn-border)] bg-[var(--warn-bg)] p-3"
              >
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn)]" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {task.description}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {task.assigneeName}
                    {task.groupName ? ` · ${task.groupName}` : ""} · passou do prazo em{" "}
                    {new Date(task.dueAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">
              Células sob esta supervisão
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              As células com caso pastoral ou presença baixa aparecem primeiro.
            </p>
          </div>
          {sensitiveGroupCount > 0 && (
            <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              {sensitiveGroupCount} em atenção
            </span>
          )}
        </div>

        {sortedGroups.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-5 text-sm text-[var(--text-muted)]">
            Nenhuma célula vinculada a esta supervisão.
          </div>
        ) : (
          <div className="space-y-3">
            {highlightedGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                href={`/pastor/celulas/${group.id}`}
                compact
              />
            ))}

            {stableGroups.length > 0 && (
              <div className="rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-4 text-[var(--ok)]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">
                      {stableGroups.length} {pluralize(stableGroups.length, "célula estável", "células estáveis")} agora.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      {stableGroups.length === 1
                        ? "Ela continua acessível abaixo como contexto, mas não é a prioridade."
                        : "Elas continuam acessíveis abaixo como contexto, mas não são a prioridade."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stableGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                href={`/pastor/celulas/${group.id}`}
                compact
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            O pastor apoia a supervisão nos pontos sensíveis. A condução diária da célula continua com supervisor e líder.
          </p>
        </div>
      </section>
    </div>
  )
}
