"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMe } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import { getRoleHomePath } from "@/lib/role-home"

export function PersonaGuard() {
  const router = useRouter()
  const { data: user, isLoading } = useMe()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getRoleHomePath(user.role))
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--text-muted)]" />
          <p className="text-lg font-medium text-[var(--text-secondary)]">
            Preparando sua visão pastoral...
          </p>
        </div>
      </div>
    )
  }

  return null
}
