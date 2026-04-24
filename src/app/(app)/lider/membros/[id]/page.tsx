"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function OldMemberProfileRedirect() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    if (id) {
      router.replace(`/membro/${id}`)
    }
  }, [id, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
    </div>
  )
}
