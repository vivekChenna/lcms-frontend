import type { CaseAuditDto } from "@/lib/api/types";

export type AuditRow = CaseAuditDto["items"][number];

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

const DESCRIBERS: Record<string, (row: AuditRow) => string> = {
  "case.submitted": () => "submitted the case",
  "case.assigned": () => "assigned the case",
  "case.auto_assigned": () => "the case was auto-assigned",
  "case.accepted": () => "accepted the case",
  "case.rejected": (row) => {
    const reason = str(asRecord(row.afterValue)["reason"]);
    return reason ? `rejected the assignment: "${reason}"` : "rejected the assignment";
  },
  "case.waiting_on_input": () => "marked the case as waiting on input",
  "case.resumed_in_progress": () => "resumed the case",
  "case.escalated": (row) => {
    const reason = str(asRecord(row.afterValue)["escalationReason"]);
    return reason ? `escalated the case: "${reason}"` : "escalated the case";
  },
  "case.escalation_cleared": () => "cleared the escalation",
  "case.closed": () => "closed the case",
  "case.updated": () => "updated the case details",
  "case.priority_changed": (row) => {
    const priority = str(asRecord(row.afterValue)["priority"]);
    return priority ? `changed the priority to ${priority}` : "changed the priority";
  },
  "comment.created": (row) =>
    asRecord(row.afterValue)["isInternal"] === true
      ? "posted an internal note"
      : "posted a comment",
  "comment.edited": () => "edited a comment",
  "comment.deleted": () => "deleted a comment",
  "info_request.raised": (row) => {
    const subject = str(asRecord(row.afterValue)["subject"]);
    return subject
      ? `raised an information request: "${subject}"`
      : "raised an information request";
  },
  "info_request.answered": () => "answered an information request",
  "info_request.reopened": () => "reopened an information request",
  "document.uploaded": (row) => {
    const filename = str(asRecord(row.afterValue)["filename"]);
    return filename ? `uploaded "${filename}"` : "uploaded a document";
  },
  "document.version_uploaded": (row) => {
    const filename = str(asRecord(row.afterValue)["filename"]);
    return filename ? `uploaded a new version of "${filename}"` : "uploaded a new document version";
  },
  "document.deleted": (row) => {
    const filename = str(asRecord(row.beforeValue)["filename"]);
    return filename ? `deleted "${filename}"` : "deleted a document";
  },
};

/** A human sentence for a known action; the raw action string for anything else, so a new or
 * unmapped action never breaks the timeline. */
export function describe(row: AuditRow): string {
  return DESCRIBERS[row.action]?.(row) ?? row.action;
}
