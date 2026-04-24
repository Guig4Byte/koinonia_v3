"use client"

import { useState } from "react"
import { Search, Users, CalendarDays, User } from "lucide-react"
import { usePastorSearch } from "@/hooks/use-pastor-search"
import Link from "next/link"

export default function PastorBuscaPage() {
  const [q, setQ] = useState("")
  const { data, isLoading } = usePastorSearch(q)

  const hasResults =
    data &&
    (data.people.length > 0 ||
      data.groups.length > 0 ||
      data.events.length > 0)

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar membros, células, eventos..."
          className="h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
        />
      </div>

      {/* Loading */}
      {isLoading && q.length >= 2 && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-[var(--surface)]"
            />
          ))}
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <div className="space-y-6">
          {/* People */}
          {data.people.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Membros
              </h3>
              <div className="space-y-2">
                {data.people.map((person) => (
                  <Link
                    key={person.id}
                    href={`/membro/${person.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--card)] p-3 transition hover:bg-[var(--surface)]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]">
                      <User className="h-5 w-5 text-[var(--text-muted)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{person.name}</p>
                        {person.riskLevel === "red" && (
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                        )}
                        {person.riskLevel === "yellow" && (
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {person.groupName ?? "Sem célula"}
                        {person.phone ? ` · ${person.phone}` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Groups */}
          {data.groups.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Células
              </h3>
              <div className="space-y-2">
                {data.groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/pastor/celulas/${group.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--card)] p-3 transition hover:bg-[var(--surface)]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]">
                      <Users className="h-5 w-5 text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{group.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {group.memberCount} membros
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Events */}
          {data.events.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Eventos
              </h3>
              <div className="space-y-2">
                {data.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/lider/eventos/${event.id}/presenca`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--card)] p-3 transition hover:bg-[var(--surface)]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]">
                      <CalendarDays className="h-5 w-5 text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {event.eventTypeName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {event.groupName} ·{" "}
                        {new Date(event.scheduledAt).toLocaleDateString(
                          "pt-BR"
                        )}
                        {event.totalAttendances > 0
                          ? ` · ${event.attendanceCount}/${event.totalAttendances} presentes`
                          : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty state */}
      {q.length >= 2 && !isLoading && !hasResults && (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Nenhum resultado encontrado para "{q}"
          </p>
        </div>
      )}

      {/* Initial state */}
      {q.length < 2 && (
        <div className="py-12 text-center">
          <Search className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Digite pelo menos 2 caracteres para buscar
          </p>
        </div>
      )}
    </div>
  )
}
