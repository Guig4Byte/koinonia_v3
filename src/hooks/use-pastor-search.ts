import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

export interface SearchResult {
  people: Array<{
    id: string
    name: string
    phone: string | null
    photoUrl: string | null
    riskLevel: string | null
    groupName: string | null
    groupId: string | null
  }>
  groups: Array<{
    id: string
    name: string
    memberCount: number
  }>
  events: Array<{
    id: string
    scheduledAt: string
    occurredAt: string | null
    groupName: string
    groupId: string
    eventTypeName: string
    attendanceCount: number
    totalAttendances: number
  }>
}

export function usePastorSearch(query: string) {
  return useQuery<SearchResult>({
    queryKey: ["pastor", "search", query],
    queryFn: async () => {
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<SearchResult>(
        `/api/pastor/search?q=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  })
}
