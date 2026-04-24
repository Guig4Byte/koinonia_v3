import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

export interface PastorDashboardAlert {
  id: string
  type: string
  severity: "high" | "medium" | "low"
  title: string
  description: string
  groupId?: string
  groupName?: string
  personId?: string
  personName?: string
}

export interface PastorDashboardGroup {
  id: string
  name: string
  memberCount: number
  atRiskCount: number
  averageAttendance: number
  lastAttendanceRate: number | null
  supervisorName: string | null
  leaderName: string | null
}

export interface PastorDashboardData {
  summary: {
    totalGroups: number
    totalMembers: number
    averageAttendance: number
    atRiskCount: number
    overdueTasksCount: number
  }
  groups: PastorDashboardGroup[]
  alerts: PastorDashboardAlert[]
}

export const pastorDashboardQueryKey = ["pastor", "dashboard"] as const

export function usePastorDashboard() {
  return useQuery<PastorDashboardData>({
    queryKey: pastorDashboardQueryKey,
    queryFn: async () => {
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<PastorDashboardData>("/api/pastor/dashboard", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    },
    staleTime: 2 * 60 * 1000,
  })
}
