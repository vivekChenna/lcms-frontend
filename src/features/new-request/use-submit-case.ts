import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { apiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { CaseDto, CreateCaseBody } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";

/** Attachments go in under the catch-all "Other" category; B11 adds a per-document picker. */
const ATTACHMENT_CATEGORY = "Other";

async function uploadAttachment(caseId: string, file: File): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  await apiJson(`/cases/${caseId}/documents?category=${ATTACHMENT_CATEGORY}`, {
    method: "POST",
    body: form,
  });
}

type SubmitArgs = { body: CreateCaseBody; files: File[] };
type SubmitResult = { created: CaseDto; failedUploads: number };

/**
 * `onBeforeNavigate` runs synchronously before `navigate()`, so a caller can clear its form's
 * dirty flag (e.g. `form.reset()`) first. `useMutation`'s own `isSuccess` only updates on the
 * next render, so a navigation-blocker gated on it would still see "dirty, not yet success" at
 * this exact point and pop an unwanted "Leave this page?" prompt.
 */
export function useSubmitCase(options: { onBeforeNavigate?: () => void } = {}) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation<SubmitResult, ApiError, SubmitArgs>({
    mutationFn: async ({ body, files }) => {
      const created = await apiJson<CaseDto>("/cases", { method: "POST", json: body });
      let failedUploads = 0;
      for (const file of files) {
        try {
          await uploadAttachment(created.id, file);
        } catch {
          failedUploads++;
        }
      }
      return { created, failedUploads };
    },
    onSuccess: ({ created, failedUploads }) => {
      options.onBeforeNavigate?.();
      void qc.invalidateQueries({ queryKey: ["cases"] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      if (failedUploads > 0) {
        toast.success(
          `Request ${created.referenceNumber} submitted, ${failedUploads} attachment(s) failed — upload them from the Documents tab`,
        );
      } else {
        toast.success(`Request ${created.referenceNumber} submitted`);
      }
      void navigate({ to: "/cases/$caseId", params: { caseId: created.id } });
    },
  });
}
