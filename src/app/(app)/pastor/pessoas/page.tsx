"use client"

import Link from "next/link"
import { AlertTriangle, CheckCircle2, Search, User } from "lucide-react"
import {
  usePastorDashboard,
  type PastorDashboardAlert,
} from "@/hooks/use-pastor-dashboard"
import { cn } from "@/lib/utils"

function getSeverityClasses(severity: PastorDashboardAlert["severity"]) {
  if (severity === "high") {
    return "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]"
  }

  if (severity === "medium") {
    return "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]"
  }

  return "border-[var(--new-border)] bg-[var(--new-bg)] text-[var(--new)]"
}

function getPersonLabel(alert: PastorDashboardAlert) {
  if (alert.severity === "high") return "Prioritário"
  if (alert.severity === "medium") return "Atenção"
  return "Observar"
}

function PersonCareCard({ alert }: { alert: PastorDashboardAlert }) {
  const href = alert.personId ? `/membro/${alert.personId}` : undefined
  const content = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white/60 dark:bg-black/10",
          getSeverityClasses(alert.severity),
        )}
      >
        <User className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {alert.personName ?? alert.title}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
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
      </div>
    </>
  )

  const className = "flex items-start gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 transition hover:bg-[var(--surface)] active:scale-[0.98]"

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
  const personAlerts = alerts.filter((alert) => alert.personId || alert.personName)

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Pessoas
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
          Quem precisa ser percebido agora?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Esta área concentra pessoas que apareceram nos sinais de cuidado da igreja.
        </p>
      </section>

      <Link
        href="/pastor/busca"
        className="flex items-center gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 transition hover:bg-[var(--surface)] active:scale-[0.98]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Buscar alguém rapidamente
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Use quando um nome surgir no corredor, culto ou conversa.
          </p>
        </div>
      </Link>

      {personAlerts.length > 0 ? (
        <section className="space-y-3">
          {personAlerts.map((alert) => (
            <PersonCareCard key={alert.id} alert={alert} />
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-4">
          <div className="flex items-start gap-3 text-[var(--ok)]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold">Nenhuma pessoa em cuidado urgente</h3>
              <p className="mt-1 text-sm leading-6">
                Continue acompanhando a equipe. Novos sinais aparecerão aqui quando alguém precisar de atenção.
              </p>
            </div>
          </div>
        </section>
      )}

      {personAlerts.length === 0 && alerts.length > 0 && (
        <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warn)]" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Há sinais na igreja, mas sem pessoa direta
              </h3>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                Veja a equipe para entender quais células ou líderes explicam a leitura.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
