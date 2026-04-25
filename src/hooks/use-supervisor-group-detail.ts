import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"

export interface SupervisorGroupMember {
  id: string
  name: string
  photoUrl: string | null
  riskLevel: string | null
  lastInteractionDays: number | null
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
    leaderId: string | null
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
