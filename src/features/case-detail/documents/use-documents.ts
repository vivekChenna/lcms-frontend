import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDownload, apiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { DocumentDto, DocumentListDto } from "@/lib/api/types";
import { invalidateCaseSubresources } from "@/lib/queries/invalidate";
import { qk } from "@/lib/queries/keys";

export const DOCUMENT_CATEGORIES = [
  "Evidence",
  "Correspondence",
  "Legal Opinion",
  "Contract",
  "Closure Document",
  "Other",
] as const;

export function useDocuments(caseId: string) {
  return useQuery({
    queryKey: qk.documents(caseId),
    queryFn: () => apiJson<DocumentListDto>(`/cases/${caseId}/documents`),
  });
}

export function useDocumentVersions(documentId: string, open: boolean) {
  return useQuery({
    queryKey: qk.documentVersions(documentId),
    queryFn: () => apiJson<DocumentListDto>(`/documents/${documentId}/versions`),
    enabled: open,
  });
}

type UploadVars = { file: File; category: (typeof DOCUMENT_CATEGORIES)[number] };

/** Uploads one file at a time; the caller tracks per-file UI state (queued/uploading/done/failed)
 * and calls `mutateAsync` per file so a retry only re-sends the one that failed. */
export function useUploadDocument(caseId: string) {
  const qc = useQueryClient();
  return useMutation<DocumentDto, ApiError, UploadVars>({
    mutationFn: ({ file, category }) => {
      const form = new FormData();
      form.append("file", file);
      return apiJson<DocumentDto>(
        `/cases/${caseId}/documents?category=${encodeURIComponent(category)}`,
        { method: "POST", body: form },
      );
    },
    onSuccess: () => invalidateCaseSubresources(qc, caseId),
  });
}

type NewVersionVars = {
  documentId: string;
  file: File;
  category?: (typeof DOCUMENT_CATEGORIES)[number];
};

export function useUploadNewVersion(caseId: string) {
  const qc = useQueryClient();
  return useMutation<DocumentDto, ApiError, NewVersionVars>({
    mutationFn: ({ documentId, file, category }) => {
      const form = new FormData();
      form.append("file", file);
      const qs = category ? `?category=${encodeURIComponent(category)}` : "";
      return apiJson<DocumentDto>(`/documents/${documentId}/versions${qs}`, {
        method: "POST",
        body: form,
      });
    },
    onSuccess: async () => {
      await invalidateCaseSubresources(qc, caseId);
      toast.success("New version uploaded");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteDocument(caseId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (documentId: string) =>
      apiJson<unknown>(`/documents/${documentId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await invalidateCaseSubresources(qc, caseId);
      toast.success("Document deleted");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function downloadDocument(id: string, filename: string) {
  return apiDownload(`/documents/${id}/download`, filename);
}
