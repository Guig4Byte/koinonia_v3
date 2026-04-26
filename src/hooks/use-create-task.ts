"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"
import { leaderDashboardQueryKey } from "@/hooks/use-leader-dashboard"
import { leaderTasksQueryKey } from "@/hooks/use-leader-tasks"
import { membersQueryKey } from "@/hooks/use-members"
import { pastorDashboardQueryKey } from "@/hooks/use-pastor-dashboard"
import { pastorSupervisorsQueryKey } from "@/hooks/use-pastor-supervisors"
import { sharedMemberProfileQueryKey } from "@/hooks/use-shared-member-profile"
import { supervisorDashboardQueryKey } from "@/hooks/use-supervisor-dashboard"
import { supervisorGroupsQueryKey } from "@/hooks/use-supervisor-groups"

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["supervisor", "group", variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ["pastor", "search"] })
      queryClient.invalidateQueries({ queryKey: leaderDashboardQueryKey })
      queryClient.invalidateQueries({ queryKey: leaderTasksQueryKey })
      queryClient.invalidateQueries({ queryKey: membersQueryKey })
      queryClient.invalidateQueries({ queryKey: pastorDashboardQueryKey })
      queryClient.invalidateQueries({ queryKey: pastorSupervisorsQueryKey })
      queryClient.invalidateQueries({ queryKey: supervisorDashboardQueryKey })
      queryClient.invalidateQueries({ queryKey: supervisorGroupsQueryKey })

      if (variables.targetType === "person") {
        queryClient.invalidateQueries({ queryKey: sharedMemberProfileQueryKey(variables.targetId) })
      }
    },
  })
}
