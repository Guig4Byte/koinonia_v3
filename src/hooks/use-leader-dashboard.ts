"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

export interface LeaderDashboardMember {
  id: string
  name: string
  photoUrl: string | null
  role: string
  riskLevel: "green" | "yellow" | "red" | null
  riskScore: number | null
  lastInteraction: string | null
  lastInteractionAt: string | null
}

export interface LeaderDashboardResponse {
  group: {
    id: string
    name: string
  }
  summary: {
    totalMembers: number
    lastAttendanceRate: number
    atRiskCount: number
  }
  members: LeaderDashboardMember[]
}

export const leaderDashboardQueryKey = ["leader", "dashboard"] as const

export function useLeaderDashboard() {
  return useQuery({
    queryKey: leaderDashboardQueryKey,
    queryFn: async () => {
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<LeaderDashboardResponse>("/api/leader/dashboard", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    },
  })
}
