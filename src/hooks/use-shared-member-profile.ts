"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"

export interface SharedMemberProfile {
  person: {
    id: string
    name: string
    phone: string | null
    photoUrl: string | null
    birthDate: string | null
    riskLevel: string | null
    riskScore: number | null
    groupName: string | null
    groupId: string | null
    interactions: Array<{
      id: string
      kind: string
      content: string
      createdAt: string
      authorName: string
    }>
    attendances: Array<{
      present: boolean
      eventDate: string
      eventTypeName: string
      groupName: string
    }>
  }
}

export function sharedMemberProfileQueryKey(memberId: string) {
  return ["member-profile", memberId] as const
}

export function useSharedMemberProfile(memberId: string) {
  return useQuery({
    queryKey: sharedMemberProfileQueryKey(memberId),
    queryFn: async () => {
            return apiRequestWithAuth<SharedMemberProfile>(`/api/members/${memberId}`, {
        method: "GET"
      })
    },
    enabled: !!memberId,
  })
}
