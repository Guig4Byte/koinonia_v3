"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDays,
  ClipboardList,
  Eye,
  Home,
  Search,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  users: Users,
  calendar: CalendarDays,
  clipboard: ClipboardList,
  eye: Eye,
  search: Search,
}

const defaultTabs = [
  { href: "/lider", label: "Célula", icon: "home" },
  { href: "/lider/membros", label: "Membros", icon: "users" },
  { href: "/lider/eventos", label: "Encontros", icon: "calendar" },
  { href: "/lider/acoes", label: "Ações", icon: "clipboard" },
]

const rootProfileRoutes = new Set(["/pastor", "/supervisor", "/lider"])

function isActiveTab(pathname: string, href: string) {
  if (pathname === href) return true

  // A raiz do perfil não deve continuar ativa dentro das subrotas.
  // Ex.: /lider/membros ativa "Membros", não "Célula".
  if (rootProfileRoutes.has(href)) return false

  return pathname.startsWith(`${href}/`)
}

export function BottomNav({
  tabs,
}: {
  tabs?: Array<{ href: string; label: string; icon: string }>
}) {
  const pathname = usePathname()
  const activeTabs = tabs ?? defaultTabs

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-[430px] items-center justify-around py-2">
        {activeTabs.map((tab) => {
          const isActive = isActiveTab(pathname, tab.href)
          const Icon = iconMap[tab.icon] ?? Home
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 transition",
                isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[0.7rem] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for mobile devices */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
