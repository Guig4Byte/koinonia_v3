"use client"

import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

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
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<LeaderTasksResponse>("/api/leader/tasks", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    },
  })
}
