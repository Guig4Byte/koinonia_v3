"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, CalendarDays, Zap, Eye, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  users: Users,
  calendar: CalendarDays,
  zap: Zap,
  eye: Eye,
  search: Search,
}

const defaultTabs = [
  { href: "/lider", label: "Visão", icon: "home" },
  { href: "/lider/membros", label: "Membros", icon: "users" },
  { href: "/lider/eventos", label: "Eventos", icon: "calendar" },
  { href: "/lider/acoes", label: "Ações", icon: "zap" },
]

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
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          const Icon = iconMap[tab.icon] ?? Home
          return (
            <Link
              key={tab.href}
              href={tab.href}
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
