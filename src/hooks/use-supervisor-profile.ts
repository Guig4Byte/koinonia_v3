import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

export interface SupervisorProfileGroup {
  id: string
  name: string
  memberCount: number
  atRiskCount: number
  averageAttendance: number
  lastAttendanceRate: number | null
  supervisorName: string | null
  leaderName: string | null
  leaderId: string | null
}

export interface SupervisorProfileTask {
  id: string
  description: string
  dueAt: string
  assigneeName: string
  groupName: string | null
}

export interface SupervisorProfileData {
  supervisor: {
    id: string
    name: string
    photoUrl: string | null
  }
  groups: SupervisorProfileGroup[]
  overdueTasks: SupervisorProfileTask[]
}

export function useSupervisorProfile(id: string) {
  return useQuery<SupervisorProfileData>({
    queryKey: ["pastor", "supervisor", id],
    queryFn: async () => {
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<SupervisorProfileData>(`/api/pastor/supervisors/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    },
    staleTime: 2 * 60 * 1000,
  })
}
