"use client"

import { useParams, useRouter } from "next/navigation"
import { useSupervisorGroupDetail } from "@/hooks/use-supervisor-group-detail"
import { useCreateTask } from "@/hooks/use-create-task"
import { AlertTriangle, CalendarX, CheckCircle, CheckCircle2, ClipboardList, Clock3, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"


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
      detail: "Nenhuma presença registrada. Confirme com o líder se houve encontro ou erro no registro.",
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
  warn: "border-[var(--warn)] bg-[var(--warn-bg)] text-[var(--warn)]",
  risk: "border-[var(--risk)] bg-[var(--risk-bg)] text-[var(--risk)]",
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
        description: `Acompanhamento da supervisora: registrar presença e atualizar status da célula ${data.group.name}`,
        dueAt: dueAt.toISOString(),
        targetType: "group",
        targetId: id,
      },
      {
        onSuccess: () => setCobrarSent(true),
      }
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

  return (
    <div className="space-y-6">
      {/* Header com voltar */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.replace("/supervisor/celulas")} className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">{group?.name}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {group?.leaderName ? `Líder: ${group.leaderName}` : "Sem líder"} · {group?.memberCount} membros
          </p>
        </div>
        {group?.hasUnregisteredAttendance && (
          <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
            <CalendarX className="h-3 w-3" />
            Presença não registrada
          </span>
        )}
      </div>

      {/* Botão Cobrar */}
      {group?.leaderUserId && (
        <button
          onClick={handleCobrar}
          disabled={createTask.isPending || cobrarSent}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {cobrarSent ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Acompanhamento enviado!
            </>
          ) : createTask.isPending ? (
            "Enviando..."
          ) : (
            `Acompanhar ${group.leaderName ?? "líder"}`
          )}
        </button>
      )}

      {/* Tasks do líder */}
      {leaderTasks.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
            Tarefas do Líder
          </h2>
          <div className="space-y-2">
            {leaderTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-3 rounded-xl border-l-4 p-3 ${
                  task.isOverdue
                    ? "border-red-400 bg-red-50 dark:bg-red-950/20"
                    : "border-[var(--border-light)] bg-[var(--card)]"
                }`}
              >
                <ClipboardList className={`mt-0.5 h-4 w-4 shrink-0 ${task.isOverdue ? "text-red-600 dark:text-red-400" : "text-[var(--text-muted)]"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{task.description}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Vence {new Date(task.dueAt).toLocaleDateString("pt-BR")}
                    {task.isOverdue && (
                      <span className="ml-1 text-red-600 dark:text-red-400">(atrasada)</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Membros */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
          Membros
        </h2>
        <div className="space-y-2">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/membro/${member.id}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--card)] p-3 transition hover:bg-[var(--surface)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]">
                <User className="h-5 w-5 text-[var(--text-muted)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{member.name}</p>
                  {member.riskLevel === "red" && (
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                  )}
                  {member.riskLevel === "yellow" && (
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {member.lastInteractionDays === null
                    ? "Sem contato registrado"
                    : member.lastInteractionDays === 0
                    ? "Contato hoje"
                    : `Último contato há ${member.lastInteractionDays} dias`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Leituras dos encontros */}
      <section>
        <h2 className="mb-1 text-sm font-medium text-[var(--text-secondary)]">
          O que os encontros revelaram
        </h2>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Use a presença como sinal para apoiar o líder, não apenas como histórico.
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
