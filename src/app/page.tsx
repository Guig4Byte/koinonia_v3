"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMe } from "@/hooks/use-auth"
import { getRoleHomePath } from "@/lib/role-home"

export default function HomePage() {
  const router = useRouter()
  const { data: user, isLoading } = useMe()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace("/login")
      return
    }

    router.replace(getRoleHomePath(user.role))
  }, [user, isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
    </div>
  )
}
