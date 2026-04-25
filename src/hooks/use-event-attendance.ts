"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"
import type { RiskLevel } from "@/types"

export interface EventAttendanceMember {
  id: string
  name: string
  photoUrl: string | null
  riskLevel: RiskLevel | null
  present: boolean | null
}

export interface EventAttendanceResponse {
  event: {
    id: string
    name: string
    scheduledAt: string
    occurredAt: string | null
  }
  members: EventAttendanceMember[]
}

export function eventAttendanceQueryKey(eventId: string) {
  return ["leader", "events", eventId, "attendance"] as const
}

export function useEventAttendance(eventId: string) {
  return useQuery({
    queryKey: eventAttendanceQueryKey(eventId),
    queryFn: async () => {
            return apiRequestWithAuth<EventAttendanceResponse>(
        `/api/leader/events/${eventId}/attendance`,
        {
          method: "GET"
        }
      )
    },
    enabled: !!eventId,
  })
}
