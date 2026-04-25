"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"
import { leaderTasksQueryKey } from "./use-leader-tasks"

export function useToggleTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
            return apiRequestWithAuth(`/api/tasks/${taskId}`, {
        method: "PATCH"
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaderTasksQueryKey })
    },
  })
}
