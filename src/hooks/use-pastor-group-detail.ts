import { useQuery } from "@tanstack/react-query";
import { apiRequestWithAuth } from "@/lib/api-client";
import type { SupervisorGroupDetail } from "@/hooks/use-supervisor-group-detail";

export function usePastorGroupDetail(id: string) {
  return useQuery<SupervisorGroupDetail>({
    queryKey: ["pastor", "group", id],
    queryFn: async () => {
      return apiRequestWithAuth<SupervisorGroupDetail>(`/api/pastor/groups/${id}`, {
        method: "GET",
      });
    },
    staleTime: 2 * 60 * 1000,
  });
}
