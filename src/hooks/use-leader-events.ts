"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"

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
            return apiRequestWithAuth<LeaderEventsResponse>("/api/leader/events", {
        method: "GET"
      })
    },
  })
}
