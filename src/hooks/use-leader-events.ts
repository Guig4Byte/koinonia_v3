"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

export interface LeaderEvent {
  id: string
  name: string
  kind: string
  scheduledAt: string
  occurredAt: string | null
  attendanceCount: number
  presentCount: number
}

export interface LeaderEventsResponse {
  events: LeaderEvent[]
}

export const leaderEventsQueryKey = ["leader", "events"] as const

export function useLeaderEvents() {
  return useQuery({
    queryKey: leaderEventsQueryKey,
    queryFn: async () => {
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<LeaderEventsResponse>("/api/leader/events", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    },
  })
}
