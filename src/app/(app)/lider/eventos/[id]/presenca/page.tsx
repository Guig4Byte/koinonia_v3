"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEventAttendance } from "@/hooks/use-event-attendance"
import { apiRequestWithAuth } from "@/lib/api-client"
import { eventAttendanceQueryKey } from "@/hooks/use-event-attendance"
import { leaderEventsQueryKey } from "@/hooks/use-leader-events"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Loader2,
  X,
} from "lucide-react"

type AttendanceValue = boolean | null

type ReadingTone = "ok" | "warn" | "risk" | "muted"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function hasLocalAttendance(
  attendances: Record<string, AttendanceValue>,
  personId: string,
) {
  return Object.prototype.hasOwnProperty.call(attendances, personId)
}

function getAttendanceReading({
  totalCount,
  markedCount,
  pendingCount,
  absentCount,
  riskAbsentCount,
}: {
  totalCount: number
  markedCount: number
  pendingCount: number
  absentCount: number
  riskAbsentCount: number
}): {
  title: string
  detail: string
  tone: ReadingTone
} {
  if (totalCount === 0) {
    return {
      title: "Nenhum membro encontrado",
      detail: "Não há pessoas ativas para registrar neste encontro.",
      tone: "muted",
    }
  }

  if (markedCount === 0) {
    return {
      title: "Presença ainda não registrada",
      detail: "Marque presença ou ausência para todos. Isso mantém o leitura completa.",
      tone: "muted",
    }
  }

  if (pendingCount > 0) {
    return {
      title: "Leitura incompleta",
      detail: `Ainda falta marcar ${pendingCount} pessoa${pendingCount === 1 ? "" : "s"}.`,
      tone: "warn",
    }
  }

  if (absentCount === 0) {
    return {
      title: "Encontro sem ausência registrada",
      detail: "Tudo marcado. Nenhuma ausência surgiu deste encontro.",
      tone: "ok",
    }
  }

  if (riskAbsentCount > 0) {
    return {
      title: "Ausência pede atenção",
      detail: `${riskAbsentCount} pessoa${riskAbsentCount === 1 ? "" : "s"} em atenção também faltou${riskAbsentCount === 1 ? "" : "ram"}. Procure depois do encontro.`,
      tone: "risk",
    }
  }

  return {
    title: "Ausências para observar",
    detail: `${absentCount} pessoa${absentCount === 1 ? "" : "s"} faltou${absentCount === 1 ? "" : "ram"}. Veja se alguém precisa de contato.`,
    tone: "warn",
  }
}

const readingToneClasses: Record<ReadingTone, string> = {
  ok: "border-[var(--border)] bg-[var(--ok-bg)] text-[var(--ok)]",
  warn: "border-[var(--warn)] bg-[var(--warn-bg)] text-[var(--warn)]",
  risk: "border-[var(--risk)] bg-[var(--risk-bg)] text-[var(--risk)]",
  muted: "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]",
}

export default function PresencaPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { data, isLoading, isError } = useEventAttendance(eventId)
  const queryClient = useQueryClient()

  const [attendances, setAttendances] = useState<Record<string, AttendanceValue>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const saveMutation = useMutation({
    mutationFn: async (attendancesList: { personId: string; present: boolean }[]) => {
      return apiRequestWithAuth("/api/events/" + eventId + "/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attendances: attendancesList }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventAttendanceQueryKey(eventId) })
      queryClient.invalidateQueries({ queryKey: leaderEventsQueryKey })
      router.back()
    },
  })

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
        <p className="text-[var(--text-secondary)]">Erro ao carregar presença.</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-[var(--new)] hover:opacity-80"
        >
          Voltar
        </button>
      </div>
    )
  }

  const { event, members } = data

  const mergedAttendances: Record<string, AttendanceValue> = {}
  members.forEach((member) => {
    mergedAttendances[member.id] = hasLocalAttendance(attendances, member.id)
      ? (attendances[member.id] as AttendanceValue)
      : member.present
  })

  const attendanceValues = Object.values(mergedAttendances)
  const presentCount = attendanceValues.filter((value) => value === true).length
  const absentCount = attendanceValues.filter((value) => value === false).length
  const markedCount = attendanceValues.filter((value) => value !== null).length
  const totalCount = members.length
  const pendingCount = totalCount - markedCount
  const progressPercent = totalCount > 0 ? Math.round((markedCount / totalCount) * 100) : 0
  const allMarked = totalCount > 0 && markedCount === totalCount
  const riskAbsentCount = members.filter((member) => {
    const attendanceValue = mergedAttendances[member.id]
    return attendanceValue === false && (member.riskLevel === "red" || member.riskLevel === "yellow")
  }).length
  const reading = getAttendanceReading({
    totalCount,
    markedCount,
    pendingCount,
    absentCount,
    riskAbsentCount,
  })

  const setAttendance = (personId: string, present: boolean) => {
    setFormError(null)
    setAttendances((prev) => ({
      ...prev,
      [personId]: present,
    }))
  }

  const handleSave = () => {
    if (!allMarked) {
      setFormError("Marque presença ou ausência para todos antes de salvar.")
      return
    }

    const list = members.map((member) => ({
      personId: member.id,
      present: mergedAttendances[member.id] === true,
    }))

    saveMutation.mutate(list)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 opacity-0 animate-fade-up">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--border-light)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Encontro
          </p>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Registrar presença
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {event.name} · {formatDate(event.scheduledAt)}
          </p>
        </div>
      </div>

      <section
        className={`rounded-2xl border p-4 shadow-sm opacity-0 animate-fade-up ${readingToneClasses[reading.tone]}`}
        style={{ animationDelay: "80ms" }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {reading.tone === "ok" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{reading.title}</p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">{reading.detail}</p>
          </div>
        </div>
      </section>

      <div
        className="rounded-2xl bg-[var(--card)] p-4 border border-[var(--border)] shadow-sm opacity-0 animate-fade-up"
        style={{ animationDelay: "140ms" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {markedCount} de {totalCount} marcados
          </span>
          <span className="text-sm font-semibold text-[var(--ok)]">
            {progressPercent}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[var(--surface)]">
          <div
            className="h-full rounded-full bg-[var(--ok)] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-[var(--surface)] px-2 py-2">
            <p className="font-semibold text-[var(--ok)]">{presentCount}</p>
            <p className="text-[var(--text-muted)]">presentes</p>
          </div>
          <div className="rounded-lg bg-[var(--surface)] px-2 py-2">
            <p className="font-semibold text-[var(--risk)]">{absentCount}</p>
            <p className="text-[var(--text-muted)]">ausentes</p>
          </div>
          <div className="rounded-lg bg-[var(--surface)] px-2 py-2">
            <p className="font-semibold text-[var(--warn)]">{pendingCount}</p>
            <p className="text-[var(--text-muted)]">pendentes</p>
          </div>
        </div>
      </div>

      <div
        className="flex flex-col gap-3 opacity-0 animate-fade-up"
        style={{ animationDelay: "200ms" }}
      >
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Marcar pessoas
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Marque todos. Ausência também é sinal.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {members.map((member) => {
            const attendanceValue = mergedAttendances[member.id]
            const isPresent = attendanceValue === true
            const isAbsent = attendanceValue === false
            const isPending = attendanceValue === null

            return (
              <div
                key={member.id}
                className={`rounded-2xl bg-[var(--card)] p-3 border shadow-sm transition ${
                  isPending ? "border-[var(--warn)]" : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)]">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(member.name)
                    )}
                  </div>

                  <div className="flex flex-1 flex-col text-left">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {member.name}
                    </span>
                    {member.riskLevel && member.riskLevel !== "green" && (
                      <span className="text-xs text-[var(--risk)]">
                        {member.riskLevel === "red" ? "Já estava em risco" : "Já estava em atenção"}
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                      isPresent
                        ? "bg-[var(--ok-bg)] text-[var(--ok)]"
                        : isAbsent
                          ? "bg-[var(--risk-bg)] text-[var(--risk)]"
                          : "bg-[var(--surface)] text-[var(--text-muted)]"
                    }`}
                    aria-label={
                      isPresent
                        ? "Presente"
                        : isAbsent
                          ? "Ausente"
                          : "Não marcado"
                    }
                  >
                    {isPresent ? (
                      <Check className="h-4 w-4" />
                    ) : isAbsent ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAttendance(member.id, true)}
                    className={`h-10 rounded-xl border px-3 text-sm font-medium transition active:scale-[0.98] ${
                      isPresent
                        ? "border-[var(--ok)] bg-[var(--ok-bg)] text-[var(--ok)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
                    }`}
                  >
                    Presente
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendance(member.id, false)}
                    className={`h-10 rounded-xl border px-3 text-sm font-medium transition active:scale-[0.98] ${
                      isAbsent
                        ? "border-[var(--risk)] bg-[var(--risk-bg)] text-[var(--risk)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
                    }`}
                  >
                    Ausente
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="opacity-0 animate-fade-up" style={{ animationDelay: "300ms" }}>
        {formError && (
          <p className="mb-3 rounded-xl border border-[var(--warn)] bg-[var(--warn-bg)] px-3 py-2 text-sm text-[var(--warn)]">
            {formError}
          </p>
        )}
        {!allMarked && !formError && (
          <p className="mb-3 rounded-xl bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)]">
            Ainda há {pendingCount} pessoa{pendingCount === 1 ? "" : "s"} sem marcação.
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={!allMarked || saveMutation.isPending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar presença"
          )}
        </button>
      </div>
    </div>
  )
}
