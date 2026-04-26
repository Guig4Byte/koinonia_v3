"use client"

import { BottomNav } from "@/components/layout/bottom-nav"
import { RoleGuard } from "@/components/layout/role-guard"
import { useMe, useLogout } from "@/hooks/use-auth"
import { getGreeting } from "@/lib/greeting"
import { LogOut } from "lucide-react"

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["supervisor"]}>
      <SupervisorLayoutInner>{children}</SupervisorLayoutInner>
    </RoleGuard>
  )
}

function SupervisorLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: user } = useMe()
  const logout = useLogout()
  const greeting = getGreeting()
  const name = user?.name?.split(" ")[0] ?? "Supervisor"

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[var(--bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted)]">{greeting},</p>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">{name}</h1>
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
      <main className="flex-1 px-5 pb-28 pt-4">{children}</main>
      <BottomNav
        tabs={[
          { label: "Visão", href: "/supervisor", icon: "eye" },
          { label: "Células", href: "/supervisor/celulas", icon: "users" },
          { label: "Líderes", href: "/supervisor/lideres", icon: "users" },
          { label: "Ações", href: "/supervisor/acoes", icon: "clipboard" },
        ]}
      />
    </div>
  )
}
