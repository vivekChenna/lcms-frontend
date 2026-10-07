import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { invalidateCase } from "@/lib/queries/invalidate";

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "The request could not be completed.");
}

/** Accept a case assigned to the caller (legal_rep) or any rep's (legal_manager); PATCH .../accept, body {}. */
export function useAcceptCase(caseId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, void>({
    mutationFn: () => apiJson<unknown>(`/cases/${caseId}/accept`, { method: "PATCH", json: {} }),
    onSuccess: async () => {
      await invalidateCase(qc, caseId);
      toast.success("Case accepted");
    },
    onError: onErrorToast,
  });
}

/** Reject an assignment with a reason (>=3 chars, enforced by the dialog); PATCH .../reject. */
export function useRejectCase(caseId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (reason: string) =>
      apiJson<unknown>(`/cases/${caseId}/reject`, { method: "PATCH", json: { reason } }),
    onSuccess: async () => {
      await invalidateCase(qc, caseId);
      toast.success("Assignment rejected");
    },
    onError: onErrorToast,
  });
}

/** Assign (or reassign) a case to a legal rep; PATCH .../assign. */
export function useAssignCase(caseId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (targetLegalRepId: string) =>
      apiJson<unknown>(`/cases/${caseId}/assign`, {
        method: "PATCH",
        json: { targetLegalRepId },
      }),
    onSuccess: async () => {
      await invalidateCase(qc, caseId);
      toast.success("Case assigned");
    },
    onError: onErrorToast,
  });
}
