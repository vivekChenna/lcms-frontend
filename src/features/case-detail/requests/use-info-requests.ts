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

type RespondVars = {
  requestId: string;
  responseText: string;
  files: File[];
  /** Called as each file lands, so the dialog can stop offering it if the send has to be retried. */
  onUploaded?: (file: File) => void;
};

/**
 * Uploads the attachments first, then sends the response. The backend only accepts attachments
 * while the request is still open, and answering closes it, so this order is not optional. If a
 * file is rejected nothing is answered: the person fixes it and sends again, and the files that
 * already went up are not offered twice.
 */
export function useRespondInfoRequest(caseId: string) {
  const qc = useQueryClient();
  return useMutation<InfoRequestDto, ApiError, RespondVars>({
    mutationFn: async ({ requestId, responseText, files, onUploaded }) => {
      for (const file of files) {
        try {
          await uploadAttachment({ requestId, file });
        } catch (err) {
          const reason = err instanceof ApiError ? err.message : "the upload failed";
          throw new ApiError(
            err instanceof ApiError ? err.status : 0,
            err instanceof ApiError ? err.code : "UPLOAD_FAILED",
            `${file.name}: ${reason}`,
          );
        }
        onUploaded?.(file);
      }
      return apiJson<InfoRequestDto>(`/information-requests/${requestId}/respond`, {
        method: "POST",
        json: { responseText },
      });
    },
    onSuccess: async () => {
      await invalidateCaseSubresources(qc, caseId);
      toast.success("Response sent");
    },
    onError: async (err) => {
      // files that did upload now show on the request, so refresh before explaining the failure
      await invalidateCaseSubresources(qc, caseId);
      onErrorToast(err);
    },
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
