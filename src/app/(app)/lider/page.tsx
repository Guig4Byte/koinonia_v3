"use client"

import Link from "next/link"
import { CheckCircle2, Loader2, Users } from "lucide-react"
import { PulseCard } from "@/components/features/pulse-card"
import { MemberCard } from "@/components/features/member-card"
import { RiskBadge } from "@/components/features/risk-badge"
import {
  useLeaderDashboard,
  type LeaderDashboardMember,
} from "@/hooks/use-leader-dashboard"

function riskPriority(level: string | null): number {
  if (level === "red") return 0
  if (level === "yellow") return 1
  return 2
}

function isAttentionMember(member: LeaderDashboardMember) {
  return member.riskLevel === "red" || member.riskLevel === "yellow"
}

function toMemberCardRiskLevel(level: LeaderDashboardMember["riskLevel"]) {
  if (level === "red") return "risk"
  if (level === "yellow") return "warn"
  if (level === "green") return "ok"
  return undefined
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function buildMemberNote(member: LeaderDashboardMember) {
  if (member.lastInteraction) return member.lastInteraction
  if (member.riskLevel === "red") return "Sem cuidado recente registrado."
  if (member.riskLevel === "yellow") return "Acompanhar antes que vire urgência."
  return undefined
}

export default function LiderPage() {
  const { data, isLoading, isError } = useLeaderDashboard()

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
        <p className="text-[var(--text-secondary)]">Erro ao carregar dados.</p>
        <p className="text-sm text-[var(--text-muted)]">
          Tente recarregar a página.
        </p>
      </div>
    )
  }

  const attentionMembers = [...data.members]
    .filter(isAttentionMember)
    .sort((a, b) => riskPriority(a.riskLevel) - riskPriority(b.riskLevel))

  const firstAttentionMember = attentionMembers[0]
  const remainingAttentionCount = Math.max(attentionMembers.length - 1, 0)

  const mainPulse = firstAttentionMember
    ? `${firstAttentionMember.name} precisa de cuidado esta semana.`
    : "Sua célula está em paz por agora."

  const supportPulse = firstAttentionMember
    ? remainingAttentionCount > 0
      ? `Mais ${remainingAttentionCount} ${pluralize(
          remainingAttentionCount,
          "pessoa também pede",
          "pessoas também pedem",
        )} atenção.`
      : "Comece por um contato simples e registre a devolutiva."
    : "Nenhum membro aparece em risco nos sinais principais."

  return (
    <div className="flex flex-col gap-6">
      <section className="opacity-0 animate-fade-up rounded-2xl p-5 text-white shadow-lg" style={{ backgroundColor: "var(--pulse-card-bg)" }}>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-stone-300">
          {data.group.name}
        </p>
        <h2 className="text-2xl font-semibold leading-snug text-white">
          {mainPulse}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-300">{supportPulse}</p>
      </section>

      <div
        className="opacity-0 animate-fade-up"
        style={{ animationDelay: "150ms" }}
      >
        <PulseCard
          totalMembers={data.summary.totalMembers}
          lastAttendanceRate={data.summary.lastAttendanceRate}
          atRiskCount={data.summary.atRiskCount}
        />
      </div>

      <section
        className="flex flex-col gap-3 opacity-0 animate-fade-up"
        style={{ animationDelay: "300ms" }}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Atenção agora
          </h3>
          {attentionMembers.length > 0 ? (
            <RiskBadge level={attentionMembers.length >= 3 ? "risk" : "warn"} />
          ) : null}
        </div>

        {attentionMembers.length > 0 ? (
          <div className="flex flex-col gap-3">
            {attentionMembers.slice(0, 3).map((member) => (
              <MemberCard
                key={member.id}
                id={member.id}
                name={member.name}
                status={member.role === "host" ? "Anfitrião" : "Membro"}
                riskLevel={toMemberCardRiskLevel(member.riskLevel)}
                note={buildMemberNote(member)}
                avatarUrl={member.photoUrl}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-5">
            <div className="flex items-start gap-3 text-[var(--ok)]">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Nenhum cuidado urgente agora.</p>
                <p className="mt-1 text-sm leading-6">
                  Continue perto da célula e registre o próximo encontro com calma.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section
        className="opacity-0 animate-fade-up rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4"
        style={{ animationDelay: "450ms" }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Quer ver a célula inteira?
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              A lista completa fica separada para a visão inicial continuar simples e prática.
            </p>
            <Link
              href="/lider/membros"
              className="mt-3 inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Ver membros
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
