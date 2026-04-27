"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  usePastorDashboard,
  type PastorDashboardAlert,
  type PastorDashboardGroup,
} from "@/hooks/use-pastor-dashboard";
import { SummaryCard } from "@/components/pastor/summary-card";
import { GroupCard } from "@/components/pastor/group-card";
import { cn } from "@/lib/utils";

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function isGroupInAttention(group: PastorDashboardGroup) {
  return (
    group.atRiskCount > 0 ||
    (group.lastAttendanceRate !== null && group.lastAttendanceRate < 60)
  );
}

function getAttendanceAccent(attendance: number) {
  if (attendance < 50) return "risk";
  if (attendance >= 80) return "ok";
  return "default";
}

function getSupervisorFocus(groups: PastorDashboardGroup[]) {
  const counts = new Map<string, number>();

  groups.forEach((group) => {
    const supervisor = group.supervisorName ?? "Supervisão sem nome";
    counts.set(supervisor, (counts.get(supervisor) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)[0];
}

function sortGroupsForPastor(groups: PastorDashboardGroup[]) {
  return [...groups].sort((a, b) => {
    if (b.atRiskCount !== a.atRiskCount) {
      return b.atRiskCount - a.atRiskCount;
    }

    const aAttendance = a.lastAttendanceRate ?? 101;
    const bAttendance = b.lastAttendanceRate ?? 101;
    return aAttendance - bAttendance;
  });
}

function getSeverityTone(severity: PastorDashboardAlert["severity"]) {
  if (severity === "high") return "risk";
  if (severity === "medium") return "warn";
  return "new";
}

function getPersonFocus(alerts: PastorDashboardAlert[]) {
  return alerts
    .filter((alert) => alert.personId || alert.personName)
    .slice(0, 2);
}

function PersonFocusCard({ alert }: { alert: PastorDashboardAlert }) {
  const tone = getSeverityTone(alert.severity);
  const href = alert.personId ? `/membro/${alert.personId}` : "/pastor/pessoas";

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border p-4 transition hover:bg-[var(--surface)] active:scale-[0.99]",
        tone === "risk" && "border-[var(--risk-border)] bg-[var(--risk-bg)]",
        tone === "warn" && "border-[var(--warn-border)] bg-[var(--warn-bg)]",
        tone === "new" && "border-[var(--new-border)] bg-[var(--new-bg)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--card)]",
            tone === "risk" && "text-[var(--risk)]",
            tone === "warn" && "text-[var(--warn)]",
            tone === "new" && "text-[var(--new)]",
          )}
        >
          <HeartHandshake className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {alert.personName ?? alert.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                {alert.groupName ?? "Pessoa acompanhada pela liderança"}
              </p>
            </div>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--text-secondary)]">
            {alert.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ActionLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 transition hover:bg-[var(--surface)] active:scale-[0.99]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-[var(--text-muted)]">
          {description}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
    </Link>
  );
}

export default function PastorPage() {
  const { data, isLoading } = usePastorDashboard();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-3xl bg-[var(--surface)]" />
        <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface)]" />
        <div className="space-y-2">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl bg-[var(--surface)]"
            />
          ))}
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const alerts = data?.alerts ?? [];
  const groups = data?.groups ?? [];

  const atRiskCount = summary?.atRiskCount ?? 0;
  const overdueTasksCount = summary?.overdueTasksCount ?? 0;
  const averageAttendance = summary?.averageAttendance ?? 0;
  const attentionGroups = sortGroupsForPastor(
    groups.filter(isGroupInAttention),
  );
  const supervisorFocus = getSupervisorFocus(attentionGroups);
  const personFocus = getPersonFocus(alerts);

  const mainPulse =
    atRiskCount > 0
      ? `${atRiskCount} ${pluralize(atRiskCount, "pessoa precisa", "pessoas precisam")} de cuidado esta semana.`
      : attentionGroups.length > 0
        ? `${attentionGroups.length} ${pluralize(attentionGroups.length, "célula pede", "células pedem")} atenção pastoral.`
        : "A igreja está tranquila por agora.";

  const supportPulse = supervisorFocus
    ? `${supervisorFocus.name} concentra ${supervisorFocus.count} ${pluralize(
        supervisorFocus.count,
        "frente sensível",
        "frentes sensíveis",
      )}.`
    : overdueTasksCount > 0
      ? `${overdueTasksCount} ${pluralize(
          overdueTasksCount,
          "retorno pendente pede",
          "retornos pendentes pedem",
        )} revisão.`
      : "Nada pede intervenção agora.";

  return (
    <div className="space-y-5">
      <section
        className="rounded-3xl p-5 text-[var(--pulse-card-fg)] shadow-lg"
        style={{ backgroundColor: "var(--pulse-card-bg)" }}
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--pulse-card-muted)]">
          Leitura pastoral de agora
        </p>
        <h2 className="text-2xl font-semibold leading-snug text-[var(--pulse-card-fg)]">
          {mainPulse}
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--pulse-card-muted)]">
          {supportPulse}
        </p>
      </section>

      <Link
        href="/pastor/busca"
        className="flex h-14 items-center gap-3 rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-[var(--text-muted)] shadow-sm transition hover:border-[var(--accent)] active:scale-[0.99]"
      >
        <Search className="h-5 w-5 shrink-0 text-[var(--accent)]" />
        <span className="text-sm">Buscar pessoa, célula ou líder...</span>
      </Link>

      <section className="grid gap-3">
        <ActionLink
          href="/pastor/pessoas"
          icon={<HeartHandshake className="h-5 w-5" />}
          title="Ver pessoas"
          description="Comece por quem precisa de cuidado esta semana."
        />
        <ActionLink
          href="/pastor/equipe"
          icon={<Users className="h-5 w-5" />}
          title="Ver equipe em atenção"
          description="Veja onde apoiar supervisores e líderes."
        />
      </section>

      {personFocus.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">
              Pessoas para olhar primeiro
            </h2>
            <Link
              href="/pastor/pessoas"
              className="text-xs font-medium text-[var(--accent)]"
            >
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {personFocus.map((alert) => (
              <PersonFocusCard key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-4">
          <div className="flex items-start gap-3 text-[var(--ok)]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold">
                Nenhuma pessoa em prioridade agora
              </h2>
              <p className="mt-1 text-sm leading-6">
                Siga perto da equipe. Quando alguém precisar, aparecerá aqui.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3 pt-1">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">
          Resumo da semana
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="Pessoas em risco"
            value={atRiskCount}
            icon={<AlertTriangle className="h-5 w-5" />}
            accent={atRiskCount > 0 ? "risk" : "ok"}
            helperText="Nas células"
          />
          <SummaryCard
            label="Células sensíveis"
            value={attentionGroups.length}
            icon={<Users className="h-5 w-5" />}
            accent={attentionGroups.length > 0 ? "risk" : "ok"}
            helperText="Esta semana"
          />
          <SummaryCard
            label="Presença média"
            value={`${averageAttendance}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            accent={getAttendanceAccent(averageAttendance)}
            helperText="Nas células"
          />
          <SummaryCard
            label="Retornos pendentes"
            value={overdueTasksCount}
            icon={<ClipboardList className="h-5 w-5" />}
            accent={overdueTasksCount > 0 ? "risk" : "ok"}
            helperText="Esta semana"
          />
        </div>
      </section>

      {attentionGroups.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">
              Células para acompanhar
            </h2>
            <Link
              href="/pastor/equipe"
              className="text-xs font-medium text-[var(--accent)]"
            >
              Ver equipe
            </Link>
          </div>
          <div className="space-y-2">
            {attentionGroups.slice(0, 3).map((group) => (
              <GroupCard key={group.id} group={group} href={`/pastor/celulas/${group.id}`} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
