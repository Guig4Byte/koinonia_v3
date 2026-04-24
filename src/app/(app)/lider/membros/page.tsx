"use client"

import { useState } from "react"
import { MemberCard } from "@/components/features/member-card"
import { useMembers } from "@/hooks/use-members"
import { Loader2, Search } from "lucide-react"

function riskPriority(level: string | null): number {
  if (level === "red") return 0
  if (level === "yellow") return 1
  if (level === "green") return 2
  return 3
}

export default function MembrosPage() {
  const { data, isLoading, isError } = useMembers()
  const [search, setSearch] = useState("")

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
        <p className="text-[var(--text-secondary)]">Erro ao carregar membros.</p>
        <p className="text-sm text-[var(--text-muted)]">
          Tente recarregar a página.
        </p>
      </div>
    )
  }

  const filteredMembers = search.trim()
    ? data.members.filter((m) =>
        m.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : data.members

  const atRisk = filteredMembers.filter(
    (m) => m.riskLevel === "red" || m.riskLevel === "yellow"
  )
  const visitors = filteredMembers.filter(
    (m) => m.tags.includes("Visitante") && !atRisk.includes(m)
  )
  const regulars = filteredMembers.filter(
    (m) => !atRisk.includes(m) && !visitors.includes(m)
  )

  const sections = [
    { title: "Em risco", members: atRisk, showWhenEmpty: false },
    { title: "Visitantes", members: visitors, showWhenEmpty: false },
    { title: "Regulares", members: regulars, showWhenEmpty: true },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="opacity-0 animate-fade-up">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Membros
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          {data.members.length} pessoas na célula
        </p>
      </div>

      {/* Search */}
      <div className="relative opacity-0 animate-fade-up">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar membro..."
          className="h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
        />
      </div>

      {sections.map(
        (section, sectionIndex) =>
          (section.members.length > 0 || section.showWhenEmpty) && (
            <div
              key={section.title}
              className="flex flex-col gap-3 opacity-0 animate-fade-up"
              style={{ animationDelay: `${(sectionIndex + 1) * 100}ms` }}
            >
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {section.title}
              </h3>

              {section.members.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {section.members
                    .sort(
                      (a, b) =>
                        riskPriority(a.riskLevel) - riskPriority(b.riskLevel)
                    )
                    .map((member) => (
                      <MemberCard
                        key={member.id}
                        id={member.id}
                        name={member.name}
                        status={
                          member.role === "host" ? "Anfitrião" : "Membro"
                        }
                        riskLevel={
                          member.riskLevel === "red"
                            ? "risk"
                            : member.riskLevel === "yellow"
                              ? "warn"
                              : member.riskLevel === "green"
                                ? "ok"
                                : undefined
                        }
                        note={member.lastInteraction ?? undefined}
                        avatarUrl={member.photoUrl}
                      />
                    ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">
                  Nenhum membro nesta categoria.
                </p>
              )}
            </div>
          )
      )}
    </div>
  )
}
