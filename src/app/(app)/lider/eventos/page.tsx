"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { useLeaderEvents, type LeaderEvent } from "@/hooks/use-leader-events"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  Users,
} from "lucide-react"

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

function isPastScheduledDate(dateStr: string): boolean {
  return new Date(dateStr).getTime() <= Date.now()
}

function getAttendanceRate(event: LeaderEvent): number | null {
  if (event.attendanceCount === 0) return null

  return Math.round((event.presentCount / event.attendanceCount) * 100)
}

function getEncounterReading(event: LeaderEvent): {
  label: string
  detail: string
  tone: "ok" | "warn" | "risk" | "muted"
  icon: ComponentType<{ className?: string }>
} {
  const rate = getAttendanceRate(event)
  const absentCount = Math.max(event.attendanceCount - event.presentCount, 0)

  if (!event.occurredAt || rate === null) {
    return {
      label: "Aguardando presença",
      detail: "Registre o encontro para que o Koinonia revele quem precisa de cuidado.",
      tone: isPastScheduledDate(event.scheduledAt) ? "warn" : "muted",
      icon: isPastScheduledDate(event.scheduledAt) ? AlertTriangle : Clock3,
    }
  }

  if (event.attendanceCount > 0 && event.presentCount === 0) {
    return {
      label: "Revisar encontro",
      detail: "Nenhuma presença registrada. Confirme se o encontro aconteceu ou se houve erro no registro.",
      tone: "risk",
      icon: AlertTriangle,
    }
  }

  if (rate < 60) {
    return {
      label: "Queda forte",
      detail: `${absentCount} ausência${absentCount === 1 ? "" : "s"} pedem cuidado depois deste encontro.`,
      tone: "risk",
      icon: AlertTriangle,
    }
  }

  if (rate < 80 || absentCount > 0) {
    return {
      label: "Observar ausências",
      detail: `${absentCount} pessoa${absentCount === 1 ? "" : "s"} ausente${absentCount === 1 ? "" : "s"}. Veja se alguém precisa de contato.`,
      tone: "warn",
      icon: AlertTriangle,
    }
  }

  return {
    label: "Encontro saudável",
    detail: "Presença registrada sem sinal urgente. Continue acompanhando de perto.",
    tone: "ok",
    icon: CheckCircle2,
  }
}

const toneClasses = {
  ok: {
    icon: "bg-[var(--ok-bg)] text-[var(--ok)]",
    badge: "bg-[var(--ok-bg)] text-[var(--ok)]",
    border: "border-[var(--border)]",
  },
  warn: {
    icon: "bg-[var(--warn-bg)] text-[var(--warn)]",
    badge: "bg-[var(--warn-bg)] text-[var(--warn)]",
    border: "border-[var(--warn)]",
  },
  risk: {
    icon: "bg-[var(--risk-bg)] text-[var(--risk)]",
    badge: "bg-[var(--risk-bg)] text-[var(--risk)]",
    border: "border-[var(--risk)]",
  },
  muted: {
    icon: "bg-[var(--surface)] text-[var(--text-muted)]",
    badge: "bg-[var(--surface)] text-[var(--text-muted)]",
    border: "border-[var(--border)]",
  },
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
        <p className="text-[var(--text-secondary)]">Erro ao carregar encontros.</p>
        <p className="text-sm text-[var(--text-muted)]">
          Tente recarregar a página.
        </p>
      </div>
    )
  }

  const waitingForAttendance = data.events.filter(
    (event) => !event.occurredAt && isPastScheduledDate(event.scheduledAt),
  )
  const upcoming = data.events.filter(
    (event) => !event.occurredAt && !isPastScheduledDate(event.scheduledAt),
  )
  const past = data.events.filter((event) => event.occurredAt)
  const pendingCount = waitingForAttendance.length
  const recentRiskCount = past.filter((event) => {
    const reading = getEncounterReading(event)
    return reading.tone === "risk" || reading.tone === "warn"
  }).length

  return (
    <div className="flex flex-col gap-6">
      <section className="opacity-0 animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Encontros da célula
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
          O que os encontros estão revelando?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Registre a presença para transformar o encontro em sinais de cuidado, não só em histórico.
        </p>
      </section>

      <section
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm opacity-0 animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Leitura rápida
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[var(--surface)] p-3">
            <p className="text-2xl font-semibold text-[var(--text-primary)]">
              {pendingCount}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              encontro{pendingCount === 1 ? "" : "s"} aguardando presença
            </p>
          </div>
          <div className="rounded-xl bg-[var(--surface)] p-3">
            <p className="text-2xl font-semibold text-[var(--text-primary)]">
              {recentRiskCount}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              leitura{recentRiskCount === 1 ? "" : "s"} pedindo atenção
            </p>
          </div>
        </div>
      </section>

      {waitingForAttendance.length > 0 && (
        <EventSection
          title="Aguardando registro"
          description="Esses encontros ainda não viraram leitura de cuidado."
          events={waitingForAttendance}
          animationDelay="140ms"
        />
      )}

      {past.length > 0 && (
        <EventSection
          title="Leituras recentes"
          description="Encontros já registrados e o que eles indicam para acompanhamento."
          events={past}
          animationDelay="200ms"
        />
      )}

      {upcoming.length > 0 && (
        <EventSection
          title="Próximos encontros"
          description="Quando acontecerem, registre a presença para alimentar o cuidado."
          events={upcoming}
          animationDelay="260ms"
        />
      )}

      {data.events.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 text-center opacity-0 animate-fade-up">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Nenhum encontro encontrado.
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Quando houver encontros, esta tela mostrará o que eles revelam para o cuidado da célula.
          </p>
        </div>
      )}
    </div>
  )
}

function EventSection({
  title,
  description,
  events,
  animationDelay,
}: {
  title: string
  description: string
  events: LeaderEvent[]
  animationDelay: string
}) {
  return (
    <section
      className="flex flex-col gap-3 opacity-0 animate-fade-up"
      style={{ animationDelay }}
    >
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </section>
  )
}

function EventCard({ event }: { event: LeaderEvent }) {
  const rate = getAttendanceRate(event)
  const reading = getEncounterReading(event)
  const ToneIcon = reading.icon
  const classes = toneClasses[reading.tone]
  const cta = event.occurredAt ? "Revisar presença" : "Registrar presença"

  return (
    <Link
      href={`/lider/eventos/${event.id}/presenca`}
      className={`flex flex-col gap-3 rounded-2xl bg-[var(--card)] p-4 border shadow-sm transition active:scale-[0.98] hover:bg-[var(--surface)] ${classes.border}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${classes.icon}`}>
          <ToneIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {event.name}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)] capitalize">
                {formatWeekday(event.scheduledAt)}, {formatDate(event.scheduledAt)}
              </p>
            </div>
            <span className={`shrink-0 rounded-lg px-2 py-1 text-[0.68rem] font-semibold ${classes.badge}`}>
              {rate === null ? "Pendente" : `${rate}%`}
            </span>
          </div>

          <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
            {reading.label}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            {reading.detail}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {rate === null
            ? "Presença não registrada"
            : `${event.presentCount}/${event.attendanceCount} presentes`}
        </span>
        <span className="font-medium text-[var(--text-secondary)]">{cta}</span>
      </div>
    </Link>
  )
}
