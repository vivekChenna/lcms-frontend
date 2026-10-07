import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ApiBody, InfoRequestDto, InfoRequestListDto } from "@/lib/api/types";
import { invalidateCaseSubresources } from "@/lib/queries/invalidate";
import { qk } from "@/lib/queries/keys";

export function useInfoRequests(caseId: string) {
  return useQuery({
    queryKey: qk.infoRequests(caseId),
    queryFn: () => apiJson<InfoRequestListDto>(`/cases/${caseId}/information-requests`),
  });
}

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "The request could not be completed.");
}

type RaiseBody = ApiBody<"/cases/{id}/information-requests", "post">;

export function useRaiseInfoRequest(caseId: string) {
  const qc = useQueryClient();
  return useMutation<InfoRequestDto, ApiError, RaiseBody>({
    mutationFn: (body: RaiseBody) =>
      apiJson<InfoRequestDto>(`/cases/${caseId}/information-requests`, {
        method: "POST",
        json: body,
      }),
    onSuccess: async () => {
      await invalidateCaseSubresources(qc, caseId);
      toast.success("Information request raised");
    },
    onError: onErrorToast,
  });
}

type AttachmentVars = { requestId: string; file: File };

async function uploadAttachment({ requestId, file }: AttachmentVars): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  await apiJson<unknown>(`/information-requests/${requestId}/attachments?category=Other`, {
    method: "POST",
    body: form,
  });
}

type RespondVars = { requestId: string; responseText: string; files: File[] };

/** Responds, then uploads any attachments sequentially; an attachment failure doesn't undo the
 * response (same graceful-degradation pattern as new-request's case attachments). */
export function useRespondInfoRequest(caseId: string) {
  const qc = useQueryClient();
  return useMutation<{ failedUploads: number }, ApiError, RespondVars>({
    mutationFn: async ({ requestId, responseText, files }) => {
      await apiJson<InfoRequestDto>(`/information-requests/${requestId}/respond`, {
        method: "POST",
        json: { responseText },
      });
      let failedUploads = 0;
      for (const file of files) {
        try {
          await uploadAttachment({ requestId, file });
        } catch {
          failedUploads++;
        }
      }
      return { failedUploads };
    },
    onSuccess: async ({ failedUploads }) => {
      await invalidateCaseSubresources(qc, caseId);
      toast.success(
        failedUploads > 0
          ? `Response sent, ${failedUploads} attachment(s) failed to upload`
          : "Response sent",
      );
    },
    onError: onErrorToast,
  });
}

export function useReopenInfoRequest(caseId: string) {
  const qc = useQueryClient();
  return useMutation<InfoRequestDto, ApiError, { requestId: string; comment: string }>({
    mutationFn: ({ requestId, comment }) =>
      apiJson<InfoRequestDto>(`/information-requests/${requestId}/reopen`, {
        method: "POST",
        json: { comment },
      }),
    onSuccess: async () => {
      await invalidateCaseSubresources(qc, caseId);
      toast.success("Information request reopened");
    },
    onError: onErrorToast,
  });
}
