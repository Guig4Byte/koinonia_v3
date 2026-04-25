"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"
import type { RiskLevel } from "@/types"

export interface MemberItem {
  id: string
  name: string
  photoUrl: string | null
  role: string
  riskLevel: RiskLevel | null
  riskScore: number | null
  lastInteraction: string | null
  lastInteractionAt: string | null
  tags: string[]
}

export interface MembersResponse {
  members: MemberItem[]
}

export const membersQueryKey = ["leader", "members"] as const

export function useMembers() {
  return useQuery({
    queryKey: membersQueryKey,
    queryFn: async () => {
            return apiRequestWithAuth<MembersResponse>("/api/leader/members", {
        method: "GET"
      })
    },
  })
}
