import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"

export interface CreateTaskInput {
  assigneeId: string
  groupId: string
  description: string
  dueAt: string
  targetType: "person" | "group" | "leader"
  targetId: string
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
            return apiRequestWithAuth<{ task: { id: string } }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(input),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["supervisor", "group", variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ["supervisor", "dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["supervisor", "groups"] })
    },
  })
}
