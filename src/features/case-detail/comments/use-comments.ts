import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ApiBody, CommentListDto } from "@/lib/api/types";
import { invalidateCaseSubresources } from "@/lib/queries/invalidate";
import { qk } from "@/lib/queries/keys";

export type CommentDto = CommentListDto[number];

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "The request could not be completed.");
}

export function useComments(caseId: string) {
  return useQuery({
    queryKey: qk.comments(caseId),
    queryFn: () => apiJson<CommentListDto>(`/cases/${caseId}/comments`),
  });
}

type CreateBody = ApiBody<"/cases/{id}/comments", "post">;

export function usePostComment(caseId: string) {
  const qc = useQueryClient();
  return useMutation<CommentDto, ApiError, CreateBody>({
    mutationFn: (body: CreateBody) =>
      apiJson<CommentDto>(`/cases/${caseId}/comments`, { method: "POST", json: body }),
    onSuccess: () => invalidateCaseSubresources(qc, caseId),
    onError: onErrorToast,
  });
}

export function useEditComment(caseId: string) {
  const qc = useQueryClient();
  return useMutation<CommentDto, ApiError, { commentId: string; body: string }>({
    mutationFn: ({ commentId, body }) =>
      apiJson<CommentDto>(`/comments/${commentId}`, { method: "PATCH", json: { body } }),
    onSuccess: async () => {
      await invalidateCaseSubresources(qc, caseId);
      toast.success("Comment updated");
    },
    onError: onErrorToast,
  });
}

export function useDeleteComment(caseId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (commentId: string) =>
      apiJson<unknown>(`/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await invalidateCaseSubresources(qc, caseId);
      toast.success("Comment deleted");
    },
    onError: onErrorToast,
  });
}
