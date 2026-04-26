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
    return "Sinal alto de afastamento. O cuidado precisa sair do radar e virar contato."
  }

  if (member.riskLevel === "yellow") {
    return "Sinal de atenção. Um contato simples agora pode evitar que vire urgência."
  }

  if (isVisitor(member)) {
    return "Pessoa nova na caminhada da célula. O primeiro acolhimento define continuidade."
  }

  if (!member.lastInteractionAt) {
    return "Ainda não há contato registrado. Mantenha perto nos próximos encontros."
  }

  return "Sem sinal urgente agora. Continue perto e registre mudanças importantes."
}

function getNextStep(member: MemberItem) {
  const name = firstName(member.name)

  if (member.riskLevel === "red") {
    return `Próximo passo: procurar ${name} e registrar a devolutiva.`
  }

  if (member.riskLevel === "yellow") {
    return `Próximo passo: fazer um contato simples com ${name}.`
  }

  if (isVisitor(member)) {
    return `Próximo passo: acolher ${name} e confirmar se deseja continuar.`
  }

  return "Próximo passo: manter proximidade no encontro."
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/60 text-sm font-semibold text-[var(--text-secondary)] dark:bg-black/10">
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
            <p className="mt-3 rounded-xl bg-white/50 px-3 py-2 text-xs leading-5 text-[var(--text-secondary)] dark:bg-black/10">
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
          <p className="text-sm font-semibold">Nenhuma pessoa em cuidado urgente agora.</p>
          <p className="mt-1 text-sm leading-6">
            A célula está sem sinais principais de risco. Continue atento aos encontros e registre mudanças importantes.
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
      ? `${totalCareItems} ${pluralize(totalCareItems, "pessoa pede", "pessoas pedem")} cuidado mais perto.`
      : "A célula está sem urgências pastorais agora."

  const pulseSubtitle =
    careQueue.length > 0
      ? "Comece pelos sinais de risco e registre a devolutiva depois do contato."
      : visitors.length > 0
        ? "A prioridade é acolher bem quem está chegando."
        : "Use esta tela como fila de cuidado, não só como lista de cadastro."

  return (
    <div className="flex flex-col gap-6">
      <section
        className="opacity-0 animate-fade-up rounded-2xl p-5 text-white shadow-lg"
        style={{ backgroundColor: "var(--pulse-card-bg)" }}
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-white/70">
          Fila de cuidado da célula
        </p>
        <h2 className="text-2xl font-semibold leading-snug text-white">
          {pulseTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/70">{pulseSubtitle}</p>
      </section>

      <div className="relative opacity-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar pessoa, tag ou anotação..."
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
            Tente buscar por outro nome, tag ou anotação.
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
                  Cuidado agora
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Pessoas com sinal de risco ou atenção.
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
                  Acolher e integrar
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Pessoas novas que precisam se sentir percebidas.
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
                  Perto e estáveis
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Lista completa sem transformar estabilidade em alerta.
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
                Nenhum membro estável nesta busca.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
