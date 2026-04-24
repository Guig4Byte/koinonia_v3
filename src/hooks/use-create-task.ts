import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api-client"
import { getStoredAccessToken } from "@/lib/auth-storage"

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
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Não autenticado")
      }
      return apiRequest<{ task: { id: string } }>("/api/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
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
