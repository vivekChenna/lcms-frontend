import type { QueryClient } from "@tanstack/react-query";
import { qk } from "./keys";

/**
 * The one invalidation rule for a case-affecting mutation: the case itself, every case list,
 * the dashboard, this case's audit trail and notifications. Call it from `onSuccess`; never
 * invalidate ad hoc.
 */
export function invalidateCase(qc: QueryClient, caseId: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.case(caseId) }),
    qc.invalidateQueries({ queryKey: ["cases"] }),
    qc.invalidateQueries({ queryKey: qk.dashboard }),
    qc.invalidateQueries({ queryKey: ["case-audit", caseId] }),
    qc.invalidateQueries({ queryKey: ["notifications"] }),
  ]);
}

/** Same, for mutations that also change comments, documents or information requests. */
export function invalidateCaseSubresources(qc: QueryClient, caseId: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: qk.comments(caseId) }),
    qc.invalidateQueries({ queryKey: qk.documents(caseId) }),
    qc.invalidateQueries({ queryKey: ["document-versions"] }),
    qc.invalidateQueries({ queryKey: qk.infoRequests(caseId) }),
    invalidateCase(qc, caseId),
  ]);
}
