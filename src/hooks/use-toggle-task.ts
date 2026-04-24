"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"
import { leaderTasksQueryKey } from "./use-leader-tasks"

export function useToggleTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const accessToken = getStoredAccessToken()
      if (!accessToken) throw new Error("Não autenticado")
      return apiRequest(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaderTasksQueryKey })
    },
  })
}
