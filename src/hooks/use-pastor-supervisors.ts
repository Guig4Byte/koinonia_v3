import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

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
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<PastorSupervisorsResponse>("/api/pastor/supervisors", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    },
    staleTime: 2 * 60 * 1000,
  })
}
