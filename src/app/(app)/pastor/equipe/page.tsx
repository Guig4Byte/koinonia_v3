"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  HeartHandshake,
  TrendingUp,
  User,
} from "lucide-react"
import {
  usePastorSupervisors,
  type PastorSupervisor,
} from "@/hooks/use-pastor-supervisors"
import { cn } from "@/lib/utils"

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function getSupervisorScore(supervisor: PastorSupervisor) {
  return supervisor.atRiskCount * 3 + supervisor.overdueTasksCount * 2 + Math.max(0, 65 - supervisor.averageAttendance)
}

function getSupervisorStatus(supervisor: PastorSupervisor) {
  if (supervisor.atRiskCount > 0 || supervisor.overdueTasksCount > 2) {
    return {
      label: "Apoiar",
      classes: "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]",
      text: `${supervisor.atRiskCount} ${pluralize(supervisor.atRiskCount, "pessoa em cuidado", "pessoas em cuidado")} · ${supervisor.overdueTasksCount} ${pluralize(supervisor.overdueTasksCount, "retorno pendente", "retornos pendentes")}`,
    }
  }

  if (supervisor.averageAttendance < 70 || supervisor.overdueTasksCount > 0) {
    return {
      label: "Atenção",
      classes: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
      text: `${supervisor.averageAttendance}% de presença média · acompanhar de perto`,
    }
  }

  return {
    label: "Estável",
    classes: "border-[var(--ok-border)] bg-[var(--ok-bg)] text-[var(--ok)]",
    text: "Nada pede intervenção agora.",
  }
}

function sortSupervisors(supervisors: PastorSupervisor[]) {
  return [...supervisors].sort((a, b) => getSupervisorScore(b) - getSupervisorScore(a))
}

export default function PastorEquipePage() {
  const { data, isLoading } = usePastorSupervisors()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-[var(--surface)]" />
        ))}
      </div>
    )
  }

  const supervisors = sortSupervisors(data?.supervisors ?? [])
  const supportCount = supervisors.filter(
    (supervisor) => supervisor.atRiskCount > 0 || supervisor.overdueTasksCount > 0,
  ).length

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[var(--border-light)] bg-[var(--card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Equipe
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
          Quem precisa de apoio pastoral?
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Veja supervisores por prioridade. O foco é apoiar, não cobrar.
        </p>
      </section>

      {supportCount > 0 && (
        <section className="rounded-2xl border border-[var(--warn-border)] bg-[var(--warn-bg)] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 text-[var(--warn)] dark:bg-black/10">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {supportCount} {pluralize(supportCount, "frente precisa de", "frentes precisam de")} apoio
              </h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                Comece por quem concentra pessoas em cuidado.
              </p>
            </div>
          </div>
        </section>
      )}

      {supervisors.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Nenhum supervisor cadastrado.
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          {supervisors.map((supervisor) => {
            const status = getSupervisorStatus(supervisor)

            return (
              <Link
                key={supervisor.id}
                href={`/pastor/equipe/${supervisor.id}`}
                className="block rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 transition hover:bg-[var(--surface)] active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)]">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {supervisor.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {supervisor.groupCount} {pluralize(supervisor.groupCount, "célula", "células")} · {supervisor.totalMembers} {pluralize(supervisor.totalMembers, "membro", "membros")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide",
                          status.classes,
                        )}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                      {status.text}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-[var(--surface)] px-2 py-2 text-center">
                        <TrendingUp className="mx-auto mb-1 h-3.5 w-3.5 text-[var(--text-muted)]" />
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {supervisor.averageAttendance}%
                        </p>
                        <p className="text-[0.65rem] text-[var(--text-muted)]">presença</p>
                      </div>
                      <div
                        className={cn(
                          "rounded-xl px-2 py-2 text-center",
                          supervisor.atRiskCount > 0
                            ? "bg-[var(--risk-bg)] text-[var(--risk)]"
                            : "bg-[var(--surface)] text-[var(--text-muted)]",
                        )}
                      >
                        <AlertTriangle className="mx-auto mb-1 h-3.5 w-3.5" />
                        <p className="text-xs font-semibold">{supervisor.atRiskCount}</p>
                        <p className="text-[0.65rem]">em cuidado</p>
                      </div>
                      <div
                        className={cn(
                          "rounded-xl px-2 py-2 text-center",
                          supervisor.overdueTasksCount > 0
                            ? "bg-[var(--warn-bg)] text-[var(--warn)]"
                            : "bg-[var(--surface)] text-[var(--text-muted)]",
                        )}
                      >
                        <ClipboardList className="mx-auto mb-1 h-3.5 w-3.5" />
                        <p className="text-xs font-semibold">{supervisor.overdueTasksCount}</p>
                        <p className="text-[0.65rem]">retornos</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
                      Ver supervisão <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </div>
  )
}
