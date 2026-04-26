"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  HeartHandshake,
  Search,
  User,
  Users,
} from "lucide-react"
import { usePastorSearch } from "@/hooks/use-pastor-search"
import type { RiskLevel } from "@/types"
import { cn } from "@/lib/utils"

function getRiskTone(riskLevel: RiskLevel | null) {
  if (riskLevel === "red") return "risk"
  if (riskLevel === "yellow") return "warn"
  if (riskLevel === "green") return "ok"
  return "neutral"
}

function getRiskLabel(riskLevel: RiskLevel | null) {
  if (riskLevel === "red") return "Prioritário"
  if (riskLevel === "yellow") return "Atenção"
  if (riskLevel === "green") return "Tranquilo"
  return "Sem leitura"
}

function getRiskDescription(riskLevel: RiskLevel | null) {
  if (riskLevel === "red") return "Precisa de cuidado de perto."
  if (riskLevel === "yellow") return "Vale acompanhar antes que pese mais."
  if (riskLevel === "green") return "Sem alerta por agora."
  return "Abra o perfil para ver o contexto pastoral."
}

function getRiskClasses(riskLevel: RiskLevel | null) {
  const tone = getRiskTone(riskLevel)

  if (tone === "risk") return "bg-[var(--risk-bg)] text-[var(--risk)] border-[var(--risk-border)]"
  if (tone === "warn") return "bg-[var(--warn-bg)] text-[var(--warn)] border-[var(--warn-border)]"
  if (tone === "ok") return "bg-[var(--ok-bg)] text-[var(--ok)] border-[var(--ok-border)]"
  return "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border-light)]"
}

export default function PastorBuscaPage() {
  const [q, setQ] = useState("")
  const { data, isLoading } = usePastorSearch(q)

  const people = data?.people ?? []
  const groups = data?.groups ?? []
  const events = data?.events ?? []
  const hasResults = people.length > 0 || groups.length > 0 || events.length > 0

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[var(--border-light)] bg-[var(--card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Busca pastoral
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
          Para encontrar alguém em segundos.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Busque pessoa, célula ou encontro sem abrir um painel pesado.
        </p>
      </section>

      <div className="sticky top-[73px] z-30 -mx-5 border-y border-[var(--border-light)] bg-[var(--bg)]/92 px-5 py-3 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--accent)]" />
          <input
            type="text"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar pessoa, célula ou líder..."
            autoFocus
            className="h-14 w-full rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] py-4 pl-12 pr-4 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
          />
        </div>
      </div>

      {isLoading && q.length >= 2 && (
        <div className="space-y-2">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl bg-[var(--surface)]"
            />
          ))}
        </div>
      )}

      {hasResults && (
        <div className="space-y-6">
          {people.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Pessoas
              </h3>
              <div className="space-y-2">
                {people.map((person) => (
                  <Link
                    key={person.id}
                    href={`/membro/${person.id}`}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 transition hover:bg-[var(--surface)] active:scale-[0.99]"
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border",
                        getRiskClasses(person.riskLevel),
                      )}
                    >
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {person.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                            {person.groupName ?? "Sem célula vinculada"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide",
                            getRiskClasses(person.riskLevel),
                          )}
                        >
                          {getRiskLabel(person.riskLevel)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                        {getRiskDescription(person.riskLevel)}
                      </p>
                      {person.phone && (
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          Contato: {person.phone}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {groups.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Células
              </h3>
              <div className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)]">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {group.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {group.memberCount} {group.memberCount === 1 ? "membro" : "membros"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {events.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Encontros
              </h3>
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)]">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {event.eventTypeName}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {event.groupName} · {new Date(event.scheduledAt).toLocaleDateString("pt-BR")}
                      </p>
                      {event.totalAttendances > 0 && (
                        <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
                          {event.attendanceCount}/{event.totalAttendances} presenças registradas
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {q.length >= 2 && !isLoading && !hasResults && (
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-6 text-center">
          <Search className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
          <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
            Nada encontrado para “{q}”.
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Tente parte do nome, célula ou líder.
          </p>
        </div>
      )}

      {q.length < 2 && (
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Digite pelo menos 2 letras
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                Exemplo: “Clau” para encontrar Cláudio e ver o contexto.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
