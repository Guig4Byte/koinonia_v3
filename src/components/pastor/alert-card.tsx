"use client"

import Link from "next/link"
import { AlertTriangle, Info, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type DashboardAlert = {
  id: string
  severity: "high" | "medium" | "low"
  title: string
  description: string
  groupId?: string
  personId?: string
}

const severityConfig = {
  high: {
    color: "border-[var(--risk-border)] bg-[var(--risk-bg)]",
    icon: AlertTriangle,
    iconColor: "text-[var(--risk)]",
  },
  medium: {
    color: "border-[var(--warn-border)] bg-[var(--warn-bg)]",
    icon: AlertCircle,
    iconColor: "text-[var(--warn)]",
  },
  low: {
    color: "border-[var(--new-border)] bg-[var(--new-bg)]",
    icon: Info,
    iconColor: "text-[var(--new)]",
  },
}

export function AlertCard({
  alert,
  groupBaseHref,
}: {
  alert: DashboardAlert
  groupBaseHref?: string
}) {
  const config = severityConfig[alert.severity]
  const Icon = config.icon

  const href = alert.personId
    ? `/membro/${alert.personId}`
    : alert.groupId && groupBaseHref
    ? `${groupBaseHref}/${alert.groupId}`
    : undefined

  const className = cn(
    "flex items-start gap-3 rounded-xl border-l-4 p-3",
    href && "transition hover:opacity-80",
    config.color
  )

  const content = (
    <>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.iconColor)} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{alert.title}</p>
        <p className="text-xs text-[var(--text-muted)]">{alert.description}</p>
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}
