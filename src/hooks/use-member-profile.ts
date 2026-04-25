"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"
import type { RiskLevel } from "@/types"

export interface AttendanceItem {
  eventId: string
  eventName: string
  scheduledAt: string
  present: boolean | null
}

export interface InteractionItem {
  id: string
  kind: string
  content: string
  authorName: string
  createdAt: string
}

export interface MemberProfile {
  id: string
  name: string
  photoUrl: string | null
  phone: string | null
  riskLevel: RiskLevel | null
  riskScore: number | null
  riskReasons: string[]
  tags: string[]
}

export interface MemberProfileResponse {
  member: MemberProfile
  attendanceTimeline: AttendanceItem[]
  interactions: InteractionItem[]
}

export function memberProfileQueryKey(memberId: string) {
  return ["leader", "members", memberId] as const
}

export function useMemberProfile(memberId: string) {
  return useQuery({
    queryKey: memberProfileQueryKey(memberId),
    queryFn: async () => {
            return apiRequestWithAuth<MemberProfileResponse>(`/api/leader/members/${memberId}`, {
        method: "GET"
      })
    },
    enabled: !!memberId,
  })
}
