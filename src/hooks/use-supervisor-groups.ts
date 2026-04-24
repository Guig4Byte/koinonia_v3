import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

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
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<SupervisorGroupsResponse>("/api/supervisor/groups", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    },
    staleTime: 2 * 60 * 1000,
  })
}
