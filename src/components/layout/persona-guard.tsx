"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMe } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

const ROLE_ROUTES: Record<string, string> = {
  pastor: "/pastor",
  supervisor: "/supervisor",
  leader: "/lider",
}

export function PersonaGuard() {
  const router = useRouter()
  const { data: user, isLoading } = useMe()

  useEffect(() => {
    if (!isLoading && user) {
      const route = ROLE_ROUTES[user.role]
      if (route) router.replace(route)
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-stone-400" />
          <p className="text-lg font-medium text-stone-600">
            Preparando sua visão pastoral...
          </p>
        </div>
      </div>
    )
  }

  return null
}
