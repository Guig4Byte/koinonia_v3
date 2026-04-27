import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"
import type { RiskLevel } from "@/types"

export interface SupervisorGroupMember {
  id: string
  name: string
  photoUrl: string | null
  riskLevel: RiskLevel | null
  riskReasons: string[]
  lastInteractionDays: number | null
  openTasksCount: number
  overdueTasksCount: number
}

export interface SupervisorGroupEvent {
  id: string
  scheduledAt: string
  occurredAt: string | null
  eventTypeName: string
  attendanceCount: number
  totalAttendances: number
}

export interface SupervisorGroupTask {
  id: string
  description: string
  dueAt: string
  isOverdue: boolean
}

export interface SupervisorGroupDetail {
  group: {
    id: string
    name: string
    leaderName: string | null
    leaderUserId: string | null
    memberCount: number
    hasUnregisteredAttendance: boolean
  }
  members: SupervisorGroupMember[]
  events: SupervisorGroupEvent[]
  leaderTasks: SupervisorGroupTask[]
}

export function useSupervisorGroupDetail(id: string) {
  return useQuery<SupervisorGroupDetail>({
    queryKey: ["supervisor", "group", id],
    queryFn: async () => {
            return apiRequestWithAuth<SupervisorGroupDetail>(`/api/supervisor/groups/${id}`, {
        method: "GET"
      })
    },
    staleTime: 2 * 60 * 1000,
  })
}
