import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"

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
            return apiRequestWithAuth<SupervisorDashboardData>("/api/supervisor/dashboard", {
        method: "GET"
      })
    },
    staleTime: 2 * 60 * 1000,
  })
}
