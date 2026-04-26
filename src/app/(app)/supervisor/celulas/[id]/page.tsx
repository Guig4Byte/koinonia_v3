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
import {
  useSupervisorGroupDetail,
  type SupervisorGroupMember,
} from "@/hooks/use-supervisor-group-detail"
import { useCreateTask } from "@/hooks/use-create-task"
import { cn } from "@/lib/utils"

type CareTone = "risk" | "warn" | "quiet"

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function getEventReading(event: { attendanceCount: number; totalAttendances: number }) {
  if (event.totalAttendances === 0) {
    return {
      label: "Presença não registrada",
      detail: "O encontro ainda não virou leitura de cuidado para a supervisão.",
      tone: "warn" as const,
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
    detail: "Presença registrada sem sinal urgente para a supervisão.",
    tone: "ok" as const,
    icon: CheckCircle2,
  }
}

const eventReadingClasses = {
  ok: "border-[var(--border-light)] bg-[var(--card)] text-[var(--ok)]",
  warn: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
  risk: "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]",
}

const memberToneClasses: Record<CareTone, string> = {
  risk: "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]",
  warn: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
  quiet: "border-[var(--border-light)] bg-[var(--card)] text-[var(--text-muted)]",
}

function getMemberPriority(member: SupervisorGroupMember) {
  if (member.riskLevel === "red") return 0
  if (member.riskLevel === "yellow") return 1
  if (member.lastInteractionDays === null) return 2
  if (member.lastInteractionDays >= 21) return 3
  return 4
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
  return (
    member.riskLevel === "red" ||
    member.riskLevel === "yellow" ||
    member.lastInteractionDays === null ||
    member.lastInteractionDays >= 21
  )
}

function getMemberTone(member: SupervisorGroupMember): CareTone {
  if (member.riskLevel === "red") return "risk"
  if (member.riskLevel === "yellow") return "warn"
  if (member.lastInteractionDays === null || member.lastInteractionDays >= 21) return "warn"
  return "quiet"
}

function getMemberLabel(member: SupervisorGroupMember) {
  if (member.riskLevel === "red") return "Prioritário"
  if (member.riskLevel === "yellow") return "Atenção"
  if (member.lastInteractionDays === null) return "Sem contato"
  if (member.lastInteractionDays >= 21) return "Contato antigo"
  return "Estável"
}

function getContactText(member: SupervisorGroupMember) {
  if (member.lastInteractionDays === null) return "Sem contato registrado"
  if (member.lastInteractionDays === 0) return "Contato hoje"
  if (member.lastInteractionDays === 1) return "Último contato ontem"

  return `Último contato há ${member.lastInteractionDays} dias`
}

function getMemberReason(member: SupervisorGroupMember) {
  if (member.riskLevel === "red") {
    return "O líder precisa tratar este cuidado como prioridade, não apenas como observação."
  }

  if (member.riskLevel === "yellow") {
    return "Ainda dá para agir cedo. Um contato do líder pode evitar que vire urgência."
  }

  if (member.lastInteractionDays === null) {
    return "Não existe interação registrada. Vale confirmar se o cuidado aconteceu fora do sistema."
  }

  if (member.lastInteractionDays >= 21) {
    return "A pessoa está há tempo demais sem retorno registrado. A supervisão deve apoiar o líder."
  }

  return "Sem sinal crítico no momento."
}

function getMemberNextStep(member: SupervisorGroupMember, leaderName: string | null | undefined) {
  const leader = leaderName ?? "o líder"

  if (member.riskLevel === "red") {
    return `Próximo passo: pedir para ${leader} registrar contato com ${member.name}.`
  }

  if (member.riskLevel === "yellow") {
    return `Próximo passo: alinhar com ${leader} um cuidado simples nesta semana.`
  }

  if (member.lastInteractionDays === null || member.lastInteractionDays >= 21) {
    return `Próximo passo: confirmar com ${leader} se houve contato e registrar retorno.`
  }

  return "Próximo passo: manter acompanhamento normal."
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/60 text-[var(--text-muted)] dark:bg-black/10">
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
            <span className="shrink-0 rounded-full bg-white/60 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-current dark:bg-black/10">
              {getMemberLabel(member)}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {getMemberReason(member)}
          </p>
          <p className="mt-2 text-xs font-semibold text-[var(--accent)]">
            {getMemberNextStep(member, leaderName)}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function SupervisorGroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data, isLoading } = useSupervisorGroupDetail(id)
  const createTask = useCreateTask()
  const [cobrarSent, setCobrarSent] = useState(false)

  const handleCobrar = () => {
    if (!data?.group.leaderUserId) return

    const dueAt = new Date()
    dueAt.setDate(dueAt.getDate() + 2)

    createTask.mutate(
      {
        assigneeId: data.group.leaderUserId,
        groupId: id,
        description: `Acompanhamento da supervisão: atualizar presença e retorno de cuidado da célula ${data.group.name}`,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.replace("/supervisor/celulas")}
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
            Presença não registrada
          </span>
        )}
      </div>

      {group?.leaderUserId && (
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
              Fila de cuidado da célula
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Veja quem precisa de cuidado e onde o líder pode precisar de apoio.
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
                <p className="text-sm font-semibold">Nenhuma pessoa em cuidado crítico agora.</p>
                <p className="mt-1 text-sm leading-6">
                  A célula não tem sinais principais de risco. Continue acompanhando o líder pelos encontros.
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
                  A lista completa fica fora daqui para manter o foco no cuidado.
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
          Use a presença como sinal de cuidado, não apenas como histórico.
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/50 text-current dark:bg-black/10">
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
