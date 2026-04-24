"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMe } from "@/hooks/use-auth"
import type { AppRole } from "@/types"

const roleHomeMap: Record<AppRole, string> = {
  pastor: "/pastor",
  supervisor: "/supervisor",
  leader: "/lider",
  host: "/lider",
  member: "/lider",
}

export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: readonly AppRole[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: user, isLoading } = useMe()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (!allowedRoles.includes(user.role)) {
      const home = roleHomeMap[user.role] ?? "/"
      router.replace(home)
    }
  }, [user, isLoading, router, allowedRoles])

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </div>
    )
  }

  return <>{children}</>
}
