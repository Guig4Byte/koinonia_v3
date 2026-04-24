"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

export interface EventAttendanceMember {
  id: string
  name: string
  photoUrl: string | null
  riskLevel: "green" | "yellow" | "red" | null
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
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<EventAttendanceResponse>(
        `/api/leader/events/${eventId}/attendance`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
    },
    enabled: !!eventId,
  })
}
