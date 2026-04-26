"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequestWithAuth } from "@/lib/api-client"
import { leaderDashboardQueryKey } from "@/hooks/use-leader-dashboard"
import { memberProfileQueryKey } from "@/hooks/use-member-profile"
import { membersQueryKey } from "@/hooks/use-members"
import { pastorDashboardQueryKey } from "@/hooks/use-pastor-dashboard"
import { pastorSupervisorsQueryKey } from "@/hooks/use-pastor-supervisors"
import { sharedMemberProfileQueryKey } from "@/hooks/use-shared-member-profile"
import { supervisorDashboardQueryKey } from "@/hooks/use-supervisor-dashboard"
import { supervisorGroupsQueryKey } from "@/hooks/use-supervisor-groups"
import type { InteractionKind } from "@/types"

export interface CreateInteractionInput {
  kind: InteractionKind
  content: string
}

export interface CreateInteractionResponse {
  interaction: {
    id: string
    personId: string
    authorId: string
    kind: InteractionKind
    content: string
    createdAt: string
  }
}

export function useCreateInteraction(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateInteractionInput) => {
      return apiRequestWithAuth<CreateInteractionResponse>("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personId,
          kind: input.kind,
          content: input.content,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedMemberProfileQueryKey(personId) })
      queryClient.invalidateQueries({ queryKey: memberProfileQueryKey(personId) })
      queryClient.invalidateQueries({ queryKey: membersQueryKey })
      queryClient.invalidateQueries({ queryKey: leaderDashboardQueryKey })
      queryClient.invalidateQueries({ queryKey: pastorDashboardQueryKey })
      queryClient.invalidateQueries({ queryKey: pastorSupervisorsQueryKey })
      queryClient.invalidateQueries({ queryKey: supervisorDashboardQueryKey })
      queryClient.invalidateQueries({ queryKey: supervisorGroupsQueryKey })
      queryClient.invalidateQueries({ queryKey: ["pastor", "search"] })
    },
  })
}
