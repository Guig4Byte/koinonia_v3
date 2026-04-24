"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

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
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<SharedMemberProfile>(`/api/members/${memberId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    },
    enabled: !!memberId,
  })
}
