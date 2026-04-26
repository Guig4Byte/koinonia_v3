"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCircle2, Loader2, Search, Sparkles, Users } from "lucide-react"
import { useMembers, type MemberItem } from "@/hooks/use-members"
import { cn } from "@/lib/utils"

type CareTone = "risk" | "warn" | "new" | "ok"

const toneClasses: Record<CareTone, string> = {
  risk: "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]",
  warn: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
  new: "border-[var(--new-border)] bg-[var(--new-bg)] text-[var(--new)]",
  ok: "border-[var(--ok-border)] bg-[var(--ok-bg)] text-[var(--ok)]",
}

const badgeClasses: Record<CareTone, string> = {
  risk: "bg-[var(--risk-bg)] text-[var(--risk)]",
  warn: "bg-[var(--warn-bg)] text-[var(--warn)]",
  new: "bg-[var(--new-bg)] text-[var(--new)]",
  ok: "bg-[var(--ok-bg)] text-[var(--ok)]",
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function firstName(name: string) {
  return name.split(" ")[0] ?? name
}

function hasTag(member: MemberItem, tag: string) {
  return member.tags.some((item) => item.toLowerCase() === tag.toLowerCase())
}

function isVisitor(member: MemberItem) {
  return hasTag(member, "Visitante")
}

function isCareQueueMember(member: MemberItem) {
  return member.riskLevel === "red" || member.riskLevel === "yellow"
}

function getRiskPriority(member: MemberItem) {
  if (member.riskLevel === "red") return 0
  if (member.riskLevel === "yellow") return 1
  if (isVisitor(member)) return 2
  if (!member.lastInteractionAt) return 3
  return 4
}

function sortMembersForCare(members: MemberItem[]) {
  return [...members].sort((a, b) => {
    const priority = getRiskPriority(a) - getRiskPriority(b)

    if (priority !== 0) return priority

    const aScore = a.riskScore ?? -1
    const bScore = b.riskScore ?? -1

    if (bScore !== aScore) return bScore - aScore

    return a.name.localeCompare(b.name)
  })
}

function getDaysSince(dateStr: string | null) {
  if (!dateStr) return null

  const timestamp = new Date(dateStr).getTime()

  if (Number.isNaN(timestamp)) return null

  return Math.max(
    0,
    Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)),
  )
}

function getContactText(member: MemberItem) {
  const days = getDaysSince(member.lastInteractionAt)

  if (days === null) return "Sem contato registrado"
  if (days === 0) return "Contato registrado hoje"
  if (days === 1) return "Último contato ontem"

  return `Último contato há ${days} dias`
}

function getCareTone(member: MemberItem): CareTone {
  if (member.riskLevel === "red") return "risk"
  if (member.riskLevel === "yellow") return "warn"
  if (isVisitor(member)) return "new"
  return "ok"
}

function getCareLabel(member: MemberItem) {
  if (member.riskLevel === "red") return "Prioritário"
  if (member.riskLevel === "yellow") return "Acompanhar"
  if (isVisitor(member)) return "Acolher"
  return "Estável"
}

function getCareReason(member: MemberItem) {
  if (member.riskLevel === "red") {
    return "Procure esta pessoa e registre um retorno breve."
  }

  if (member.riskLevel === "yellow") {
    return "Um contato simples pode ajudar bastante."
  }

  if (isVisitor(member)) {
    return "Acolha bem e confirme se deseja continuar."
  }

  if (!member.lastInteractionAt) {
    return "Sem contato registrado. Mantenha por perto."
  }

  return "Sem alerta por agora. Continue perto."
}

function getNextStep(member: MemberItem) {
  const name = firstName(member.name)

  if (member.riskLevel === "red") {
    return `Procure ${name} e registre um breve retorno.`
  }

  if (member.riskLevel === "yellow") {
    return `Faça um contato simples com ${name}.`
  }

  if (isVisitor(member)) {
    return `Acolha ${name} e confirme se deseja continuar.`
  }

  return "Mantenha por perto nos encontros."
}

function MemberCareCard({ member }: { member: MemberItem }) {
  const tone = getCareTone(member)

  return (
    <Link
      href={`/membro/${member.id}`}
      className={cn(
        "block rounded-2xl border p-4 shadow-sm transition active:scale-[0.98] hover:bg-[var(--surface)]",
        toneClasses[tone],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-sm font-semibold text-[var(--text-secondary)] dark:bg-black/10">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            member.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {member.name}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {member.role === "host" ? "Anfitrião" : "Membro"} · {getContactText(member)}
              </p>
            </div>
            <span className={cn("shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide", badgeClasses[tone])}>
              {getCareLabel(member)}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {getCareReason(member)}
          </p>
          <p className="mt-2 text-xs font-semibold text-[var(--accent)]">
            {getNextStep(member)}
          </p>

          {member.lastInteraction ? (
            <p className="mt-3 rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)] dark:bg-black/10">
              Última anotação: {member.lastInteraction}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

function EmptyCareState() {
  return (
    <div className="rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-5 text-[var(--ok)]">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">Nenhuma pessoa em prioridade agora.</p>
          <p className="mt-1 text-sm leading-6">
            Continue atento aos encontros e registre mudanças importantes.
          </p>
        </div>
      </div>
    </div>
  )
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

  const query = search.trim().toLowerCase()
  const filteredMembers = query
    ? data.members.filter((member) => {
        const searchable = [
          member.name,
          member.role,
          ...member.tags,
          member.lastInteraction ?? "",
        ]
          .join(" ")
          .toLowerCase()

        return searchable.includes(query)
      })
    : data.members

  const careQueue = sortMembersForCare(filteredMembers.filter(isCareQueueMember))
  const visitors = sortMembersForCare(
    filteredMembers.filter((member) => isVisitor(member) && !isCareQueueMember(member)),
  )
  const stableMembers = sortMembersForCare(
    filteredMembers.filter((member) => !isCareQueueMember(member) && !isVisitor(member)),
  )

  const totalCareItems = careQueue.length + visitors.length
  const pulseTitle =
    totalCareItems > 0
      ? `${totalCareItems} ${pluralize(totalCareItems, "pessoa para", "pessoas para")} acompanhar de perto.`
      : "A célula está tranquila por agora."

  const pulseSubtitle =
    careQueue.length > 0
      ? "Comece por quem precisa de cuidado e registre o retorno."
      : visitors.length > 0
        ? "A prioridade é acolher bem quem está chegando."
        : "Use esta tela como uma fila simples."

  return (
    <div className="flex flex-col gap-6">
      <section
        className="opacity-0 animate-fade-up rounded-2xl p-5 text-[var(--pulse-card-fg)] shadow-lg"
        style={{ backgroundColor: "var(--pulse-card-bg)" }}
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--pulse-card-muted)]">
          Membros da célula
        </p>
        <h2 className="text-2xl font-semibold leading-snug text-[var(--pulse-card-fg)]">
          {pulseTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--pulse-card-muted)]">{pulseSubtitle}</p>
      </section>

      <div className="relative opacity-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar pessoa, tag ou observação..."
          className="h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] pl-9 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
        />
      </div>

      {filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-8 text-center opacity-0 animate-fade-up">
          <Search className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
          <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
            Nenhuma pessoa encontrada.
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Tente buscar por outro nome, tag ou observação.
          </p>
        </div>
      ) : (
        <>
          <section
            className="flex flex-col gap-3 opacity-0 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Cuidar primeiro
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Comece por essas pessoas.
                </p>
              </div>
              {careQueue.length > 0 ? (
                <span className="rounded-full bg-[var(--risk-bg)] px-2 py-1 text-xs font-semibold text-[var(--risk)]">
                  {careQueue.length}
                </span>
              ) : null}
            </div>

            {careQueue.length > 0 ? (
              <div className="flex flex-col gap-3">
                {careQueue.map((member) => (
                  <MemberCareCard key={member.id} member={member} />
                ))}
              </div>
            ) : (
              <EmptyCareState />
            )}
          </section>

          {visitors.length > 0 && (
            <section
              className="flex flex-col gap-3 opacity-0 animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Acolher
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Pessoas novas que precisam ser bem recebidas.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {visitors.map((member) => (
                  <MemberCareCard key={member.id} member={member} />
                ))}
              </div>
            </section>
          )}

          <section
            className="flex flex-col gap-3 opacity-0 animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--text-muted)]" />
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Caminhando bem
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Sem alerta por agora.
                </p>
              </div>
            </div>

            {stableMembers.length > 0 ? (
              <div className="flex flex-col gap-2">
                {stableMembers.map((member) => (
                  <Link
                    key={member.id}
                    href={`/membro/${member.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--card)] p-3 transition hover:bg-[var(--surface)] active:scale-[0.98]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-semibold text-[var(--text-muted)]">
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {getContactText(member)}
                      </p>
                    </div>
                    <Sparkles className="h-4 w-4 text-[var(--ok)]" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border-light)] bg-[var(--card)] p-4 text-sm text-[var(--text-muted)]">
                Nenhum membro nessa seção.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
