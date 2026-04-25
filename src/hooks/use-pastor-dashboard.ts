import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"

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
            return apiRequestWithAuth<PastorDashboardData>("/api/pastor/dashboard", {
        method: "GET"
      })
    },
    staleTime: 2 * 60 * 1000,
  })
}
