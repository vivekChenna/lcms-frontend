import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ApiBody, RoutingRuleDto, RoutingRuleListDto } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "The request could not be completed.");
}

export function useRoutingRules() {
  return useQuery({
    queryKey: qk.routingRules,
    queryFn: () => apiJson<RoutingRuleListDto>("/routing-rules"),
  });
}

type CreateBody = ApiBody<"/routing-rules", "post">;

export function useCreateRoutingRule() {
  const qc = useQueryClient();
  return useMutation<RoutingRuleDto, ApiError, CreateBody>({
    mutationFn: (body) => apiJson<RoutingRuleDto>("/routing-rules", { method: "POST", json: body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.routingRules });
      toast.success("Routing rule created");
    },
    onError: onErrorToast,
  });
}

type UpdateBody = ApiBody<"/routing-rules/{id}", "patch">;

export function useUpdateRoutingRule(id: string) {
  const qc = useQueryClient();
  return useMutation<RoutingRuleDto, ApiError, UpdateBody>({
    mutationFn: (body) =>
      apiJson<RoutingRuleDto>(`/routing-rules/${id}`, { method: "PATCH", json: body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.routingRules });
      toast.success("Routing rule updated");
    },
    onError: onErrorToast,
  });
}
