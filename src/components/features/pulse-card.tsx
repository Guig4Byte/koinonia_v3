"use client"

import { Users, CalendarDays, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PulseCardProps {
  totalMembers: number
  lastAttendanceRate: number
  atRiskCount: number
  className?: string
}

export function PulseCard({
  totalMembers,
  lastAttendanceRate,
  atRiskCount,
  className,
}: PulseCardProps) {
  const items = [
    {
      icon: Users,
      label: "Membros",
      value: totalMembers,
      delayMs: 0,
    },
    {
      icon: CalendarDays,
      label: "Última presença",
      value: `${lastAttendanceRate}%`,
      delayMs: 150,
    },
    {
      icon: AlertTriangle,
      label: "Em risco",
      value: atRiskCount,
      delayMs: 300,
    },
  ]

  return (
    <div
      className={cn(
        "rounded-2xl p-5 text-[var(--pulse-card-fg)] shadow-lg",
        className
      )}
      style={{ backgroundColor: "var(--pulse-card-bg)" }}
    >
      <h2 className="mb-4 text-sm font-medium text-[var(--pulse-card-muted)]">
        Resumo da célula
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-2 text-center opacity-0 animate-fade-up"
            style={{ animationDelay: `${item.delayMs}ms` }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pulse-card-soft)]">
              <item.icon className="h-5 w-5 text-[var(--pulse-card-muted)]" />
            </div>
            <div>
              <p className="text-xl font-semibold">{item.value}</p>
              <p className="text-xs text-[var(--pulse-card-muted)]">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
