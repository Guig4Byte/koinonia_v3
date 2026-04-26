"use client"

import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  Loader2,
  Users,
} from "lucide-react"
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

function firstName(name: string) {
  return name.split(" ")[0] ?? name
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function buildMemberNote(member: LeaderDashboardMember) {
  if (member.lastInteraction) return member.lastInteraction
  if (member.riskLevel === "red") return "Procure esta pessoa e registre um retorno breve."
  if (member.riskLevel === "yellow") return "Um contato simples pode evitar que vire urgência."
  return undefined
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

function buildCareContext(member: LeaderDashboardMember | undefined) {
  if (!member) {
    return {
      title: "Sua célula está sem urgência agora.",
      subtitle: "Mantenha a presença em dia e registre sinais importantes.",
      step: "Comece pelo próximo encontro.",
    }
  }

  const days = getDaysSince(member.lastInteractionAt)
  const contactText =
    days === null
      ? "sem contato registrado"
      : days === 0
        ? "com contato registrado hoje"
        : days === 1
          ? "com último contato ontem"
          : `sem contato há ${days} dias`

  return {
    title: `${firstName(member.name)} precisa de cuidado esta semana.`,
    subtitle: `${member.name} está ${contactText}.`,
    step:
      member.riskLevel === "red"
        ? "Procure primeiro esta pessoa."
        : "Faça um contato simples e observe de perto.",
  }
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 shadow-sm transition hover:bg-[var(--surface)] active:scale-[0.98]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
          {description}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
    </Link>
  )
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
  const careContext = buildCareContext(firstAttentionMember)

  const supportPulse = firstAttentionMember
    ? remainingAttentionCount > 0
      ? `Mais ${remainingAttentionCount} ${pluralize(
          remainingAttentionCount,
          "pessoa também precisa",
          "pessoas também precisam",
        )} de atenção.`
      : careContext.step
    : "Nenhum membro aparece em risco nos sinais principais."

  return (
    <div className="flex flex-col gap-6">
      <section
        className="rounded-2xl p-5 text-white shadow-lg opacity-0 animate-fade-up"
        style={{ backgroundColor: "var(--pulse-card-bg)" }}
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-white/70">
          {data.group.name}
        </p>
        <h2 className="text-2xl font-semibold leading-snug text-white">
          {careContext.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/75">
          {careContext.subtitle}
        </p>
        <p className="mt-2 text-sm font-semibold text-white">{supportPulse}</p>
      </section>

      <section
        className="grid gap-3 opacity-0 animate-fade-up"
        style={{ animationDelay: "120ms" }}
      >
        <QuickAction
          href="/lider/eventos"
          icon={CalendarDays}
          title="Registrar encontro"
          description="Marque presença e deixe o sistema apontar quem precisa de cuidado."
        />
        <QuickAction
          href="/lider/membros"
          icon={Users}
          title="Ver membros"
          description="Veja primeiro quem precisa de contato ou acolhimento."
        />
        {attentionMembers.length > 0 ? (
          <QuickAction
            href="/lider/acoes"
            icon={ClipboardList}
            title="Ver ações"
            description="Acompanhe contatos pendentes e retornos desta semana."
          />
        ) : null}
      </section>

      <section
        className="flex flex-col gap-3 opacity-0 animate-fade-up"
        style={{ animationDelay: "240ms" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Cuidado agora
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Comece por quem aparece aqui.
            </p>
          </div>
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
                <p className="text-sm font-semibold">Sem cuidado urgente agora.</p>
                <p className="mt-1 text-sm leading-6">
                  Continue perto da célula e registre o próximo encontro com calma.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section
        className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 opacity-0 animate-fade-up"
        style={{ animationDelay: "360ms" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Resumo da célula
          </h3>
        </div>
        <PulseCard
          totalMembers={data.summary.totalMembers}
          lastAttendanceRate={data.summary.lastAttendanceRate}
          atRiskCount={data.summary.atRiskCount}
          className="shadow-none"
        />
      </section>
    </div>
  )
}
