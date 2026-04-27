"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
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
  const attendancePressure = Math.max(0, 70 - supervisor.averageAttendance)

  return supervisor.atRiskCount * 5 + supervisor.overdueTasksCount * 2 + attendancePressure
}

function getSupervisorStatus(supervisor: PastorSupervisor) {
  if (supervisor.atRiskCount > 0) {
    return {
      label: "Apoio pastoral",
      classes: "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]",
      text: `${supervisor.atRiskCount} ${pluralize(supervisor.atRiskCount, "caso pede", "casos pedem")} atenção pastoral com a supervisão.`,
    }
  }

  if (supervisor.overdueTasksCount > 0) {
    return {
      label: "Acompanhar",
      classes: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
      text: `${supervisor.overdueTasksCount} ${pluralize(supervisor.overdueTasksCount, "retorno passou", "retornos passaram")} do prazo. Vale apoiar sem transformar em cobrança.`,
    }
  }

  if (supervisor.averageAttendance < 70 && supervisor.totalMembers > 0) {
    return {
      label: "Observar",
      classes: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
      text: `${supervisor.averageAttendance}% de presença média nas células. Veja se há padrão pastoral.`,
    }
  }

  return {
    label: "Estável",
    classes: "border-[var(--ok-border)] bg-[var(--ok-bg)] text-[var(--ok)]",
    text: "Nada pede apoio pastoral específico agora.",
  }
}

function sortSupervisors(supervisors: PastorSupervisor[]) {
  return [...supervisors].sort((a, b) => getSupervisorScore(b) - getSupervisorScore(a))
}

function needsPastoralSupport(supervisor: PastorSupervisor) {
  return (
    supervisor.atRiskCount > 0 ||
    supervisor.overdueTasksCount > 0 ||
    (supervisor.averageAttendance < 70 && supervisor.totalMembers > 0)
  )
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
  const supportCount = supervisors.filter(needsPastoralSupport).length

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[var(--border-light)] bg-[var(--card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Equipe pastoral
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
          Onde minha liderança precisa de apoio?
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Esta visão mostra onde supervisores e líderes podem precisar de presença pastoral.
        </p>
      </section>

      <section
        className={cn(
          "rounded-2xl border p-4",
          supportCount > 0
            ? "border-[var(--warn-border)] bg-[var(--warn-bg)]"
            : "border-[var(--ok-border)] bg-[var(--ok-bg)]",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] dark:bg-black/10",
              supportCount > 0 ? "text-[var(--warn)]" : "text-[var(--ok)]",
            )}
          >
            {supportCount > 0 ? (
              <HeartHandshake className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {supportCount > 0
                ? `${supportCount} ${pluralize(supportCount, "supervisão pede", "supervisões pedem")} apoio`
                : "Equipe sem pressão pastoral agora"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              {supportCount > 0
                ? "Comece por quem concentra casos qualificados, retornos vencidos ou presença baixa."
                : "Use esta tela apenas quando precisar entender a supervisão; a rotina fica com cada líder."}
            </p>
          </div>
        </div>
      </section>

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
                          {supervisor.groupCount} {pluralize(supervisor.groupCount, "célula", "células")} · {supervisor.totalMembers} {pluralize(supervisor.totalMembers, "pessoa", "pessoas")}
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
                        <HeartHandshake className="mx-auto mb-1 h-3.5 w-3.5 text-[var(--text-muted)]" />
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {supervisor.atRiskCount}
                        </p>
                        <p className="text-[0.65rem] text-[var(--text-muted)]">casos</p>
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
                      <div
                        className={cn(
                          "rounded-xl px-2 py-2 text-center",
                          supervisor.averageAttendance < 70 && supervisor.totalMembers > 0
                            ? "bg-[var(--warn-bg)] text-[var(--warn)]"
                            : "bg-[var(--surface)] text-[var(--text-muted)]",
                        )}
                      >
                        <TrendingUp className="mx-auto mb-1 h-3.5 w-3.5" />
                        <p className="text-xs font-semibold">
                          {supervisor.averageAttendance}%
                        </p>
                        <p className="text-[0.65rem]">presença</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
                      {needsPastoralSupport(supervisor) ? "Entender apoio" : "Ver contexto"} <ArrowRight className="h-3.5 w-3.5" />
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
