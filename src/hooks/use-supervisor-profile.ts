import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"

export interface SupervisorProfileGroup {
  id: string
  name: string
  memberCount: number
  atRiskCount: number
  averageAttendance: number
  lastAttendanceRate: number | null
  supervisorName: string | null
  leaderName: string | null
  leaderUserId: string | null
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
            return apiRequestWithAuth<SupervisorProfileData>(`/api/pastor/supervisors/${id}`, {
        method: "GET"
      })
    },
    staleTime: 2 * 60 * 1000,
  })
}
