"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMe } from "@/hooks/use-auth"

export default function HomePage() {
  const router = useRouter()
  const { data: user, isLoading } = useMe()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace("/login")
      return
    }

    const route =
      user.role === "pastor"
        ? "/pastor"
        : user.role === "supervisor"
        ? "/supervisor"
        : user.role === "leader"
        ? "/lider"
        : "/login"

    router.replace(route)
  }, [user, isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
    </div>
  )
}
