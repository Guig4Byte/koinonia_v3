import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"

export interface PastorSupervisor {
  id: string
  name: string
  photoUrl: string | null
  groupCount: number
  totalMembers: number
  averageAttendance: number
  atRiskCount: number
  overdueTasksCount: number
}

export interface PastorSupervisorsResponse {
  supervisors: PastorSupervisor[]
}

export const pastorSupervisorsQueryKey = ["pastor", "supervisors"] as const

export function usePastorSupervisors() {
  return useQuery<PastorSupervisorsResponse>({
    queryKey: pastorSupervisorsQueryKey,
    queryFn: async () => {
            return apiRequestWithAuth<PastorSupervisorsResponse>("/api/pastor/supervisors", {
        method: "GET"
      })
    },
    staleTime: 2 * 60 * 1000,
  })
}
