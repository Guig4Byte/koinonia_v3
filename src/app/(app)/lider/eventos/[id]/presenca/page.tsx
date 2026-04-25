"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEventAttendance } from "@/hooks/use-event-attendance"
import { apiRequestWithAuth } from "@/lib/api-client"
import { eventAttendanceQueryKey } from "@/hooks/use-event-attendance"
import { leaderEventsQueryKey } from "@/hooks/use-leader-events"
import { Loader2, ArrowLeft, Check, X } from "lucide-react"

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

export default function PresencaPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { data, isLoading, isError } = useEventAttendance(eventId)
  const queryClient = useQueryClient()

  const [attendances, setAttendances] = useState<Record<string, boolean>>({})

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

  // Merge dados do servidor com estado local
  const mergedAttendances: Record<string, boolean> = {}
  members.forEach((m) => {
    mergedAttendances[m.id] =
      attendances[m.id] !== undefined
        ? (attendances[m.id] as boolean)
        : (m.present ?? true) // default true se nunca registrado
  })

  const presentCount = Object.values(mergedAttendances).filter(Boolean).length
  const totalCount = members.length
  const progressPercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  const toggleAttendance = (personId: string) => {
    setAttendances((prev) => ({
      ...prev,
      [personId]: !mergedAttendances[personId],
    }))
  }

  const handleSave = () => {
    const list = members.map((m) => ({
      personId: m.id,
      present: mergedAttendances[m.id] ?? true,
    }))
    saveMutation.mutate(list)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 opacity-0 animate-fade-up">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--border-light)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Presença
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {formatDate(event.scheduledAt)}
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div
        className="rounded-2xl bg-[var(--card)] p-4 border border-[var(--border)] shadow-sm opacity-0 animate-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {presentCount} de {totalCount} presentes
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
      </div>

      {/* Lista de membros */}
      <div
        className="flex flex-col gap-3 opacity-0 animate-fade-up"
        style={{ animationDelay: "200ms" }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Membros
        </h3>

        <div className="flex flex-col gap-2">
          {members.map((member) => {
            const isPresent = mergedAttendances[member.id] ?? true
            return (
              <button
                key={member.id}
                onClick={() => toggleAttendance(member.id)}
                className="flex items-center gap-3 rounded-2xl bg-[var(--card)] p-3 border border-[var(--border)] shadow-sm transition active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-semibold text-[var(--text-secondary)]">
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
                      {member.riskLevel === "red" ? "Em risco" : "Atenção"}
                    </span>
                  )}
                </div>

                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                    isPresent
                      ? "bg-[var(--ok-bg)] text-[var(--ok)]"
                      : "bg-[var(--risk-bg)] text-[var(--risk)]"
                  }`}
                >
                  {isPresent ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Botão salvar */}
      <div className="opacity-0 animate-fade-up" style={{ animationDelay: "300ms" }}>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
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
