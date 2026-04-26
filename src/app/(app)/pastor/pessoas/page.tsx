"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Search,
  User,
  Users,
} from "lucide-react"
import {
  usePastorDashboard,
  type PastorDashboardAlert,
} from "@/hooks/use-pastor-dashboard"
import { cn } from "@/lib/utils"

type SeverityTone = "risk" | "warn" | "new"

function getSeverityScore(severity: PastorDashboardAlert["severity"]) {
  if (severity === "high") return 3
  if (severity === "medium") return 2
  return 1
}

function getSeverityTone(severity: PastorDashboardAlert["severity"]): SeverityTone {
  if (severity === "high") return "risk"
  if (severity === "medium") return "warn"
  return "new"
}

function getSeverityClasses(severity: PastorDashboardAlert["severity"]) {
  const tone = getSeverityTone(severity)

  if (tone === "risk") {
    return "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]"
  }

  if (tone === "warn") {
    return "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]"
  }

  return "border-[var(--new-border)] bg-[var(--new-bg)] text-[var(--new)]"
}

function getPersonLabel(alert: PastorDashboardAlert) {
  if (alert.severity === "high") return "Prioritário"
  if (alert.severity === "medium") return "Atenção"
  return "Observar"
}

function getNextStep(alert: PastorDashboardAlert) {
  if (alert.severity === "high") {
    return "Procure esta semana e registre retorno."
  }

  if (alert.severity === "medium") {
    return "Confirme como está antes do próximo encontro."
  }

  return "Mantenha por perto e observe os próximos sinais."
}

function getUniquePersonAlerts(alerts: PastorDashboardAlert[]) {
  const byPerson = new Map<string, PastorDashboardAlert>()

  alerts
    .filter((alert) => alert.personId || alert.personName)
    .forEach((alert) => {
      const key = alert.personId ?? alert.personName ?? alert.id
      const current = byPerson.get(key)

      if (!current || getSeverityScore(alert.severity) > getSeverityScore(current.severity)) {
        byPerson.set(key, alert)
      }
    })

  return [...byPerson.values()].sort(
    (a, b) => getSeverityScore(b.severity) - getSeverityScore(a.severity),
  )
}

function PersonCareCard({ alert }: { alert: PastorDashboardAlert }) {
  const href = alert.personId ? `/membro/${alert.personId}` : undefined
  const content = (
    <>
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white/60 dark:bg-black/10",
          getSeverityClasses(alert.severity),
        )}
      >
        <User className="h-5 w-5" />
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
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide",
              getSeverityClasses(alert.severity),
            )}
          >
            {getPersonLabel(alert)}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          {alert.description}
        </p>
        <p className="mt-3 rounded-xl bg-[var(--surface)] px-3 py-2 text-xs font-medium leading-5 text-[var(--text-secondary)]">
          {getNextStep(alert)}
        </p>
      </div>
    </>
  )

  const className = "flex items-start gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 transition hover:bg-[var(--surface)] active:scale-[0.99]"

  if (!href) return <div className={className}>{content}</div>

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}

export default function PastorPessoasPage() {
  const { data, isLoading } = usePastorDashboard()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-[var(--surface)]" />
        ))}
      </div>
    )
  }

  const alerts = data?.alerts ?? []
  const personAlerts = getUniquePersonAlerts(alerts)
  const nonPersonAlerts = alerts.filter((alert) => !alert.personId && !alert.personName)

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[var(--border-light)] bg-[var(--card)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Pessoas
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
          Quem precisa ser percebido agora?
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Pessoas que apareceram nos sinais de cuidado. Pouca lista, mais contexto.
        </p>
      </section>

      <Link
        href="/pastor/busca"
        className="flex h-14 items-center gap-3 rounded-2xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-[var(--text-muted)] shadow-sm transition hover:border-[var(--accent)] active:scale-[0.99]"
      >
        <Search className="h-5 w-5 shrink-0 text-[var(--accent)]" />
        <span className="min-w-0 flex-1 text-sm">Buscar alguém rapidamente...</span>
        <ArrowRight className="h-4 w-4 shrink-0" />
      </Link>

      {personAlerts.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Pessoas em cuidado
            </h3>
            <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
              {personAlerts.length} {personAlerts.length === 1 ? "pessoa" : "pessoas"}
            </span>
          </div>
          <div className="space-y-2">
            {personAlerts.map((alert) => (
              <PersonCareCard key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-4">
          <div className="flex items-start gap-3 text-[var(--ok)]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold">Nenhuma pessoa em prioridade agora</h3>
              <p className="mt-1 text-sm leading-6">
                Siga perto da equipe. Quando alguém precisar, aparecerá aqui.
              </p>
            </div>
          </div>
        </section>
      )}

      {nonPersonAlerts.length > 0 && (
        <section className="rounded-2xl border border-[var(--warn-border)] bg-[var(--warn-bg)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warn)]" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Há sinais em células ou equipe
              </h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                Alguns sinais não apontam para uma pessoa. Veja onde apoiar.
              </p>
              <Link
                href="/pastor/equipe"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
              >
                Ver equipe <Users className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              O objetivo não é listar todo mundo
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Aqui aparece quem precisa de atenção agora. Para os demais, use a busca.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
