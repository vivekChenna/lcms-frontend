import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ApiBody, CaseDto, Profile } from "@/lib/api/types";
import { can } from "@/lib/permissions";
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

type EscalateBody = ApiBody<"/cases/{id}/escalate", "patch">;

/** Escalate or clear escalation; PATCH .../escalate, body { isEscalated, reason? }. */
export function useEscalateCase(caseId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, EscalateBody>({
    mutationFn: (body: EscalateBody) =>
      apiJson<unknown>(`/cases/${caseId}/escalate`, { method: "PATCH", json: body }),
    onSuccess: async (_data, body) => {
      await invalidateCase(qc, caseId);
      toast.success(body.isEscalated ? "Case escalated" : "Escalation cleared");
    },
    onError: onErrorToast,
  });
}

type CloseBody = ApiBody<"/cases/{id}/close", "patch">;

/** Close a case; PATCH .../close, body { confirm: true, closureSummary, closureOutcomeId }. */
export function useCloseCase(caseId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, CloseBody>({
    mutationFn: (body: CloseBody) =>
      apiJson<unknown>(`/cases/${caseId}/close`, { method: "PATCH", json: body }),
    onSuccess: async () => {
      await invalidateCase(qc, caseId);
      toast.success("Case closed");
    },
    onError: onErrorToast,
  });
}

/** Change priority; PATCH .../priority, body { priority }. */
export function useChangePriority(caseId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, CaseDto["priority"]>({
    mutationFn: (priority: CaseDto["priority"]) =>
      apiJson<unknown>(`/cases/${caseId}/priority`, { method: "PATCH", json: { priority } }),
    onSuccess: async () => {
      await invalidateCase(qc, caseId);
      toast.success("Priority updated");
    },
    onError: onErrorToast,
  });
}

type UpdateBody = ApiBody<"/cases/{id}", "patch">;

/** Edit case fields; PATCH /cases/{id}, partial body (an explicit null clears a field). */
export function useUpdateCase(caseId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, UpdateBody>({
    mutationFn: (body: UpdateBody) =>
      apiJson<unknown>(`/cases/${caseId}`, { method: "PATCH", json: body }),
    onSuccess: async () => {
      await invalidateCase(qc, caseId);
      toast.success("Case updated");
    },
    onError: onErrorToast,
  });
}

export type CaseAction =
  "accept" | "reject" | "assign" | "escalate" | "close" | "priority" | "edit";

/**
 * Which workflow actions `me` may take on `caseItem` right now, in a fixed display order. Each rule
 * is one the server enforces, so no button is offered that would only be refused:
 * - accept/reject: the assigned representative, while the case is Assigned
 * - escalate: the assigned representative, a manager or an admin
 * - close: the same people, and only from In Progress (not while Waiting on Input)
 * - edit: the submitter or an admin, and only while Submitted
 */
export function actionsFor(me: Profile, caseItem: CaseDto): CaseAction[] {
  const notClosed = caseItem.status !== "Closed";
  const owningRep = me.role === "legal_rep" && caseItem.assignedLegalRepId === me.id;
  // a representative acts only on their own case; managers and admins on any
  const mayActAsLegal = me.role === "legal_rep" ? owningRep : true;

  const canAcceptOrReject = owningRep && caseItem.status === "Assigned";
  const canEscalate = can.escalate(me.role) && notClosed && mayActAsLegal;
  const canClose = can.close(me.role) && caseItem.status === "In Progress" && mayActAsLegal;
  const canEdit =
    can.editCase(me.role) &&
    caseItem.status === "Submitted" &&
    (caseItem.requesterId === me.id || me.role === "admin");

  const actions: CaseAction[] = [];
  if (canAcceptOrReject) actions.push("accept", "reject");
  if (can.assign(me.role) && notClosed) actions.push("assign");
  if (canEscalate) actions.push("escalate");
  if (canClose) actions.push("close");
  if (can.changePriority(me.role) && notClosed) actions.push("priority");
  if (canEdit) actions.push("edit");
  return actions;
}
