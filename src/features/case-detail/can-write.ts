import type { CaseDto, Profile } from "@/lib/api/types";

/**
 * Whether `me` may add to this case (comments, documents). Mirrors the server's write rule: nobody
 * writes to a closed case, a viewer never does, and a legal representative only on their own case
 * once they have accepted it (In Progress or Waiting on Input). Requesters, managers and admins
 * are not tied to the assignee.
 */
export function canWriteToCase(
  me: Pick<Profile, "id" | "role">,
  caseItem: Pick<CaseDto, "status" | "assignedLegalRepId">,
): boolean {
  if (me.role === "viewer" || caseItem.status === "Closed") return false;
  if (me.role === "legal_rep") {
    return (
      caseItem.assignedLegalRepId === me.id &&
      (caseItem.status === "In Progress" || caseItem.status === "Waiting on Input")
    );
  }
  return true;
}
