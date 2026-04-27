"use client"

import Link from "next/link"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CalendarX,
  CheckCircle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  User,
  Users,
} from "lucide-react"
import { ContextSignalList } from "@/components/features/context-signal-list"
import type { SupervisorGroupMember } from "@/hooks/use-supervisor-group-detail"
import { usePastorGroupDetail } from "@/hooks/use-pastor-group-detail"
import { useCreateTask } from "@/hooks/use-create-task"
import { cn } from "@/lib/utils"

type CareTone = "risk" | "warn" | "quiet"

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function getEventReading(event: { attendanceCount: number; totalAttendances: number }) {
  if (event.totalAttendances === 0) {
    return {
      label: "Leitura pendente",
      detail: "A presença deste encontro ainda não foi registrada. Trate como contexto operacional, não como sinal pastoral sozinho.",
      tone: "quiet" as const,
      icon: Clock3,
    }
  }

  const rate = Math.round((event.attendanceCount / event.totalAttendances) * 100)
  const absentCount = Math.max(event.totalAttendances - event.attendanceCount, 0)

  if (event.attendanceCount === 0) {
    return {
      label: "Revisar encontro",
      detail: "Nenhuma presença registrada. Confirme com o líder se houve encontro ou se falta registrar presença.",
      tone: "risk" as const,
      icon: AlertTriangle,
    }
  }

  if (rate < 60) {
    return {
      label: "Queda forte",
      detail: `${absentCount} ausência${absentCount === 1 ? "" : "s"} pedem apoio próximo ao líder.`,
      tone: "risk" as const,
      icon: AlertTriangle,
    }
  }

  if (rate < 80 || absentCount > 0) {
    return {
      label: "Observar ausências",
      detail: `${absentCount} pessoa${absentCount === 1 ? "" : "s"} ausente${absentCount === 1 ? "" : "s"}. Veja se o líder precisa de apoio no cuidado.`,
      tone: "warn" as const,
      icon: AlertTriangle,
    }
  }

  return {
    label: "Encontro saudável",
    detail: "Presença registrada sem sinal pastoral neste encontro.",
    tone: "ok" as const,
    icon: CheckCircle2,
  }
}

function getEventSignals(event: { attendanceCount: number; totalAttendances: number }) {
  const signals: string[] = []

  if (event.totalAttendances === 0) {
    signals.push("Presença ainda não registrada")
    return signals
  }

  const rate = Math.round((event.attendanceCount / event.totalAttendances) * 100)
  const absentCount = Math.max(event.totalAttendances - event.attendanceCount, 0)

  signals.push(`${rate}% de presença no encontro`)

  if (absentCount > 0) {
    signals.push(`${absentCount} ${absentCount === 1 ? "ausência" : "ausências"} para observar`)
  }

  if (event.attendanceCount === 0) {
    signals.push("Nenhuma presença marcada")
  }

  return signals
}

const eventReadingClasses = {
  ok: "border-[var(--border-light)] bg-[var(--card)] text-[var(--ok)]",
  quiet: "border-[var(--border-light)] bg-[var(--card)] text-[var(--text-muted)]",
  warn: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
  risk: "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]",
}

const memberToneClasses: Record<CareTone, string> = {
  risk: "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]",
  warn: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
  quiet: "border-[var(--border-light)] bg-[var(--card)] text-[var(--text-muted)]",
}

function hasPastoralAttention(member: SupervisorGroupMember) {
  const reasons = member.riskReasons ?? []

  return (
    member.riskLevel === "red" ||
    member.overdueTasksCount > 0 ||
    reasons.includes("escalado_ao_pastor") ||
    reasons.includes("caso_sensivel") ||
    reasons.includes("multiplos_sinais") ||
    reasons.includes("acompanhamento_vencido")
  )
}

function getMemberPriority(member: SupervisorGroupMember) {
  if (member.riskLevel === "red") return 0
  if (member.overdueTasksCount > 0) return 1
  if (member.riskLevel === "yellow" && hasPastoralAttention(member)) return 2
  return 3
}

function sortMembersForCare(members: SupervisorGroupMember[]) {
  return [...members].sort((a, b) => {
    const priority = getMemberPriority(a) - getMemberPriority(b)

    if (priority !== 0) return priority

    const aDays = a.lastInteractionDays ?? 999
    const bDays = b.lastInteractionDays ?? 999

    if (bDays !== aDays) return bDays - aDays

    return a.name.localeCompare(b.name)
  })
}

function shouldBeInCareQueue(member: SupervisorGroupMember) {
  return hasPastoralAttention(member)
}

function getMemberTone(member: SupervisorGroupMember): CareTone {
  if (member.riskLevel === "red" || member.overdueTasksCount > 0) return "risk"
  if (member.riskLevel === "yellow" && hasPastoralAttention(member)) return "warn"
  return "quiet"
}

function getMemberLabel(member: SupervisorGroupMember) {
  const reasons = member.riskReasons ?? []

  if (reasons.includes("escalado_ao_pastor") || reasons.includes("caso_sensivel")) {
    return "Escalado"
  }

  if (member.overdueTasksCount > 0 || reasons.includes("acompanhamento_vencido")) {
    return "Vencido"
  }

  if (member.riskLevel === "red") return "Prioritário"
  if (member.riskLevel === "yellow" && hasPastoralAttention(member)) return "Atenção"
  return "Sem sinais ativos"
}

function getContactText(member: SupervisorGroupMember) {
  if (member.lastInteractionDays === null) return "Sem retorno registrado"
  if (member.lastInteractionDays === 0) return "Retorno registrado hoje"
  if (member.lastInteractionDays === 1) return "Último retorno ontem"

  return `Último retorno há ${member.lastInteractionDays} dias`
}

function getMemberReason(member: SupervisorGroupMember) {
  const reasons = member.riskReasons ?? []

  if (reasons.includes("escalado_ao_pastor") || reasons.includes("caso_sensivel")) {
    return "A liderança já pediu apoio pastoral. Este caso não deve ficar só na rotina da célula."
  }

  if (member.overdueTasksCount > 0 || reasons.includes("acompanhamento_vencido")) {
    return "Há acompanhamento vencido depois de sinais importantes. Vale apoiar o líder na próxima resposta."
  }

  if (reasons.includes("multiplos_sinais")) {
    return "Os sinais se acumularam. A questão pede discernimento pastoral, não apenas observação."
  }

  if (member.riskLevel === "red") {
    return "O líder precisa tratar este cuidado como prioridade, não apenas como observação."
  }

  return "Sem sinal crítico no momento."
}

function getMemberSignals(member: SupervisorGroupMember) {
  const signals: string[] = []
  const reasons = member.riskReasons ?? []

  if (member.riskLevel === "red") {
    signals.push("Sinal pastoral prioritário")
  } else if (member.riskLevel === "yellow" && hasPastoralAttention(member)) {
    signals.push("Sinal pastoral em atenção")
  }

  if (reasons.includes("escalado_ao_pastor") || reasons.includes("caso_sensivel")) {
    signals.push("Pedido de apoio pastoral")
  }

  if (member.overdueTasksCount > 0 || reasons.includes("acompanhamento_vencido")) {
    signals.push("Acompanhamento vencido")
  }

  if (reasons.includes("multiplos_sinais")) {
    signals.push("Múltiplos sinais acumulados")
  }

  if (member.lastInteractionDays === null && signals.length > 0) {
    signals.push("Sem retorno registrado para este cuidado")
  } else if (member.lastInteractionDays !== null && member.lastInteractionDays >= 21 && signals.length > 0) {
    signals.push(`Último retorno há ${member.lastInteractionDays} dias`)
  }

  return signals
}

function getMemberNextStep(member: SupervisorGroupMember, leaderName: string | null | undefined) {
  const leader = leaderName ?? "o líder"
  const reasons = member.riskReasons ?? []

  if (reasons.includes("escalado_ao_pastor") || reasons.includes("caso_sensivel")) {
    return `Combine com ${leader} a próxima resposta pastoral.`
  }

  if (member.overdueTasksCount > 0 || reasons.includes("acompanhamento_vencido")) {
    return `Peça para ${leader} atualizar o acompanhamento e registre o retorno.`
  }

  if (member.riskLevel === "red") {
    return `Peça para ${leader} registrar retorno com ${member.name}.`
  }

  return "Mantenha acompanhamento normal."
}

function shouldShowPastoralAction({
  careMembersCount,
  overdueLeaderTasksCount,
  latestAttendanceRate,
}: {
  careMembersCount: number
  overdueLeaderTasksCount: number
  latestAttendanceRate: number | null
}) {
  return (
    careMembersCount > 0 ||
    overdueLeaderTasksCount > 0 ||
    (latestAttendanceRate !== null && latestAttendanceRate < 60)
  )
}

function MemberCareRow({
  member,
  leaderName,
}: {
  member: SupervisorGroupMember
  leaderName: string | null | undefined
}) {
  const tone = getMemberTone(member)

  return (
    <Link
      href={`/membro/${member.id}`}
      className={cn(
        "block rounded-2xl border p-4 transition hover:bg-[var(--surface)] active:scale-[0.98]",
        memberToneClasses[tone],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--text-muted)] dark:bg-black/10">
          <User className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {member.name}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {getContactText(member)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--surface-soft)] px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-current dark:bg-black/10">
              {getMemberLabel(member)}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {getMemberReason(member)}
          </p>
          <ContextSignalList
            signals={getMemberSignals(member)}
            title="Por que pede atenção?"
            tone={tone === "risk" ? "risk" : tone === "warn" ? "warn" : "neutral"}
            className="mt-3"
          />
          <p className="mt-3 text-xs font-semibold text-[var(--accent)]">
            {getMemberNextStep(member, leaderName)}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function PastorGroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data, isLoading } = usePastorGroupDetail(id)
  const createTask = useCreateTask()
  const [cobrarSent, setCobrarSent] = useState(false)

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.replace("/pastor/equipe")
  }

  const handleCobrar = () => {
    if (!data?.group.leaderUserId) return

    const dueAt = new Date()
    dueAt.setDate(dueAt.getDate() + 2)

    createTask.mutate(
      {
        assigneeId: data.group.leaderUserId,
        groupId: id,
        description: `Pastoral: atualizar presença e retorno da célula ${data.group.name}`,
        dueAt: dueAt.toISOString(),
        targetType: "group",
        targetId: id,
      },
      {
        onSuccess: () => setCobrarSent(true),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-[var(--surface)]" />
        <div className="h-32 animate-pulse rounded-xl bg-[var(--surface)]" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    )
  }

  const group = data?.group
  const members = data?.members ?? []
  const events = data?.events ?? []
  const leaderTasks = data?.leaderTasks ?? []
  const careMembers = sortMembersForCare(members.filter(shouldBeInCareQueue))
  const stableMembersCount = Math.max(members.length - careMembers.length, 0)
  const latestEvent = events.find((event) => event.totalAttendances > 0)
  const latestAttendanceRate = latestEvent
    ? Math.round((latestEvent.attendanceCount / latestEvent.totalAttendances) * 100)
    : null
  const showPastoralAction = shouldShowPastoralAction({
    careMembersCount: careMembers.length,
    overdueLeaderTasksCount: leaderTasks.filter((task) => task.isOverdue).length,
    latestAttendanceRate,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">{group?.name}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {group?.leaderName ? `Líder: ${group.leaderName}` : "Sem líder"} · {group?.memberCount} membros
          </p>
        </div>
        {group?.hasUnregisteredAttendance && (
          <span className="flex items-center gap-1 rounded-lg bg-[var(--warn-bg)] px-2 py-1 text-xs font-medium text-[var(--warn)]">
            <CalendarX className="h-3 w-3" />
            Presença pendente
          </span>
        )}
      </div>

      {group?.leaderUserId && showPastoralAction && (
        <button
          onClick={handleCobrar}
          disabled={createTask.isPending || cobrarSent}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[#fffaf2] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {cobrarSent ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Pedido enviado
            </>
          ) : createTask.isPending ? (
            "Enviando..."
          ) : (
            `Pedir retorno a ${group.leaderName ?? "líder"}`
          )}
        </button>
      )}

      {leaderTasks.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
            Encaminhamentos do líder
          </h2>
          <div className="space-y-2">
            {leaderTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-3 rounded-xl border-l-4 p-3 ${
                  task.isOverdue
                    ? "border-[var(--risk)] bg-[var(--risk-bg)]"
                    : "border-[var(--border-light)] bg-[var(--card)]"
                }`}
              >
                <ClipboardList className={`mt-0.5 h-4 w-4 shrink-0 ${task.isOverdue ? "text-[var(--risk)]" : "text-[var(--text-muted)]"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{task.description}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Vence {new Date(task.dueAt).toLocaleDateString("pt-BR")}
                    {task.isOverdue && (
                      <span className="ml-1 text-[var(--risk)]">(atrasada)</span>
                    )}
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
              Pessoas que pedem cuidado pastoral
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Mostra só casos graves, acumulados, vencidos ou escalados. Para os demais, use a busca.
            </p>
          </div>
          <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
            {careMembers.length} em atenção
          </span>
        </div>

        {careMembers.length > 0 ? (
          <div className="space-y-3">
            {careMembers.map((member) => (
              <MemberCareRow
                key={member.id}
                member={member}
                leaderName={group?.leaderName}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-5 text-[var(--ok)]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Nenhuma pessoa crítica agora.</p>
                <p className="mt-1 text-sm leading-6">
                  A célula não tem leituras principais de risco. Continue acompanhando o líder pelos encontros.
                </p>
              </div>
            </div>
          </div>
        )}

        {stableMembersCount > 0 && (
          <div className="mt-3 rounded-xl border border-[var(--border-light)] bg-[var(--card)] p-3">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {stableMembersCount} {pluralize(stableMembersCount, "pessoa está", "pessoas estão")} sem sinal crítico.
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  Use a busca quando precisar encontrar alguém específico fora da fila pastoral.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-medium text-[var(--text-secondary)]">
          O que os encontros revelaram
        </h2>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Presença boa é contexto; presença ruim pode virar sinal.
        </p>
        <div className="space-y-2">
          {events.map((event) => {
            const reading = getEventReading(event)
            const Icon = reading.icon
            const rate = event.totalAttendances > 0
              ? Math.round((event.attendanceCount / event.totalAttendances) * 100)
              : null

            return (
              <div
                key={event.id}
                className={`rounded-xl border p-3 ${eventReadingClasses[reading.tone]}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-current dark:bg-black/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {event.eventTypeName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {new Date(event.scheduledAt).toLocaleDateString("pt-BR")}
                          {rate !== null
                            ? ` · ${event.attendanceCount}/${event.totalAttendances} presentes`
                            : " · presença pendente"}
                        </p>
                      </div>
                      {rate !== null && (
                        <span className="rounded-lg bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                          {rate}%
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                      {reading.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                      {reading.detail}
                    </p>
                    <ContextSignalList
                      signals={getEventSignals(event)}
                      title={event.totalAttendances === 0 || reading.tone === "ok" ? "Contexto" : "Por que pede atenção?"}
                      tone={reading.tone === "risk" ? "risk" : reading.tone === "warn" ? "warn" : "neutral"}
                      className="mt-3"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
