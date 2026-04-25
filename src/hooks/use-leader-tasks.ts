"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"

export interface LeaderTask {
  id: string
  description: string
  dueAt: string
  completedAt: string | null
  targetType: string
  targetId: string
  groupName: string | null
  personName: string | null
  personId: string | null
}

export interface LeaderTasksResponse {
  tasks: LeaderTask[]
}

export const leaderTasksQueryKey = ["leader", "tasks"] as const

export function useLeaderTasks() {
  return useQuery({
    queryKey: leaderTasksQueryKey,
    queryFn: async () => {
            return apiRequestWithAuth<LeaderTasksResponse>("/api/leader/tasks", {
        method: "GET"
      })
    },
  })
}
