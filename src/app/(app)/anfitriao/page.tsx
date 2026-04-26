"use client"

import { LogOut } from "lucide-react"
import { RoleGuard } from "@/components/layout/role-guard"
import { useLogout, useMe } from "@/hooks/use-auth"
import { getGreeting } from "@/lib/greeting"

export default function AnfitriaoPage() {
  return (
    <RoleGuard allowedRoles={["host"]}>
      <AnfitriaoContent />
    </RoleGuard>
  )
}

function AnfitriaoContent() {
  const { data: user } = useMe()
  const logout = useLogout()
  const greeting = getGreeting()
  const name = user?.name?.split(" ")[0] ?? "Anfitrião"

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/80 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted)]">{greeting},</p>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              {name}
            </h1>
          </div>
          <button
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center px-5 py-10">
        <section className="w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Área do anfitrião
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
            Seu fluxo será simples.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            Esta área deve servir para apoiar o encontro sem mostrar dados pastorais sensíveis. Por enquanto, confirme presenças com o líder da célula.
          </p>
          <div className="mt-5 rounded-2xl border border-[var(--info-border)] bg-[var(--info-soft)] p-4">
            <p className="text-sm font-medium text-[var(--info)]">
              Próxima etapa planejada
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              Check-in e apoio de presença, sem relatórios, risco pastoral ou histórico sensível.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
