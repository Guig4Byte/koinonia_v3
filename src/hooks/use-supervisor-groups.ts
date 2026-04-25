import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"

export interface SupervisorGroup {
  id: string
  name: string
  memberCount: number
  atRiskCount: number
  averageAttendance: number
  lastAttendanceRate: number | null
  hasUnregisteredAttendance: boolean
  leaderName: string | null
}

export interface SupervisorGroupsResponse {
  groups: SupervisorGroup[]
}

export const supervisorGroupsQueryKey = ["supervisor", "groups"] as const

export function useSupervisorGroups() {
  return useQuery<SupervisorGroupsResponse>({
    queryKey: supervisorGroupsQueryKey,
    queryFn: async () => {
            return apiRequestWithAuth<SupervisorGroupsResponse>("/api/supervisor/groups", {
        method: "GET"
      })
    },
    staleTime: 2 * 60 * 1000,
  })
}
