"use client"

import Link from "next/link"
import { useLeaderEvents, type LeaderEvent } from "@/hooks/use-leader-events"
import { Loader2, CalendarDays, Users, CheckCircle2, Circle } from "lucide-react"

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatWeekday(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", { weekday: "long" })
}

export default function EventosPage() {
  const { data, isLoading, isError } = useLeaderEvents()

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
        <p className="text-[var(--text-secondary)]">Erro ao carregar eventos.</p>
        <p className="text-sm text-[var(--text-muted)]">
          Tente recarregar a página.
        </p>
      </div>
    )
  }

  const upcoming = data.events.filter((e) => !e.occurredAt)
  const past = data.events.filter((e) => e.occurredAt)

  return (
    <div className="flex flex-col gap-6">
      <div className="opacity-0 animate-fade-up">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Eventos
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          {data.events.length} reuniões na célula
        </p>
      </div>

      {upcoming.length > 0 && (
        <div
          className="flex flex-col gap-3 opacity-0 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Próximas
          </h3>
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div
          className="flex flex-col gap-3 opacity-0 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Realizadas
          </h3>
          {past.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ event }: { event: LeaderEvent }) {
  const isRegistered = event.attendanceCount > 0
  const allAbsent = isRegistered && event.presentCount === 0

  return (
    <Link
      href={`/lider/eventos/${event.id}/presenca`}
      className="flex items-center gap-4 rounded-2xl bg-[var(--card)] p-4 border border-[var(--border)] shadow-sm transition active:scale-[0.98] hover:bg-[var(--surface)]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--text-secondary)]">
        <CalendarDays className="h-5 w-5" />
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {event.name}
          </h3>
          {isRegistered ? (
            <CheckCircle2 className={`h-5 w-5 ${allAbsent ? "text-[var(--risk)]" : "text-[var(--ok)]"}`} />
          ) : (
            <Circle className="h-5 w-5 text-[var(--border)]" />
          )}
        </div>
        <p className="text-sm text-[var(--text-muted)] capitalize">
          {formatWeekday(event.scheduledAt)}, {formatDate(event.scheduledAt)}
        </p>
        {isRegistered ? (
          <p className={`flex items-center gap-1 text-xs ${allAbsent ? "text-[var(--risk)]" : "text-[var(--text-muted)]"}`}>
            <Users className="h-3 w-3" />
            {event.presentCount}/{event.attendanceCount} presentes
            {event.attendanceCount > 0 && (
              <span className="ml-1 font-medium">
                ({Math.round((event.presentCount / event.attendanceCount) * 100)}%)
              </span>
            )}
          </p>
        ) : (
          <p className="flex items-center gap-1 text-xs text-[var(--warn)]">
            <Circle className="h-3 w-3" />
            Presença não registrada
          </p>
        )}
      </div>
    </Link>
  )
}
