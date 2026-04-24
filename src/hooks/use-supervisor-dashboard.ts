import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

export interface SupervisorDashboardAlert {
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

export interface SupervisorDashboardGroup {
  id: string
  name: string
  memberCount: number
  atRiskCount: number
  averageAttendance: number
  lastAttendanceRate: number | null
  supervisorName: string | null
  leaderName: string | null
}

export interface SupervisorDashboardData {
  summary: {
    totalGroups: number
    totalMembers: number
    averageAttendance: number
    atRiskCount: number
    overdueTasksCount: number
  }
  groups: SupervisorDashboardGroup[]
  alerts: SupervisorDashboardAlert[]
}

export const supervisorDashboardQueryKey = ["supervisor", "dashboard"] as const

export function useSupervisorDashboard() {
  return useQuery<SupervisorDashboardData>({
    queryKey: supervisorDashboardQueryKey,
    queryFn: async () => {
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<SupervisorDashboardData>("/api/supervisor/dashboard", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    },
    staleTime: 2 * 60 * 1000,
  })
}
