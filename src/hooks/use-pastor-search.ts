import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"
import type { RiskLevel } from "@/types"

export interface SearchResult {
  people: Array<{
    id: string
    name: string
    phone: string | null
    photoUrl: string | null
    riskLevel: RiskLevel | null
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
            return apiRequestWithAuth<SearchResult>(
        `/api/pastor/search?q=${encodeURIComponent(query)}`,
        {
          method: "GET"
        }
      )
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  })
}
