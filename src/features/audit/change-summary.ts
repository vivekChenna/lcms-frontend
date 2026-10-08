import { formatDate, formatDateTime } from "@/lib/format";
import { PRIORITY_LABEL, ROLE_LABEL } from "@/lib/labels";
import type { CasePriority, UserRole } from "@/lib/api/types";

/** Turns an id-like field into a name ("assignedLegalRepId" + uuid -> "Vivek Legal Rep"). */
export type NameResolver = (key: string, value: unknown) => string | undefined;

export type ChangeRow = { key: string; label: string; before: string | null; after: string | null };
export type ChangeSummary = {
  /** changed: before and after compared; recorded: only what was stored; empty: nothing to show. */
  kind: "changed" | "recorded" | "empty";
  rows: ChangeRow[];
};

// Technical fields a person never needs to read; the case reference is already shown separately.
const HIDDEN = new Set(["id", "referenceNumber"]);

const LABELS: Record<string, string> = {
  status: "Status",
  priority: "Priority",
  assignedLegalRepId: "Assigned to",
  targetLegalRepId: "Assigned to",
  previousLegalRepId: "Previously assigned to",
  responderId: "Asked of",
  requesterId: "Requester",
  categoryId: "Category",
  caseTypeId: "Case type",
  departmentId: "Department",
  entityId: "Entity",
  businessUnitId: "Business unit",
  closureOutcomeId: "Outcome",
  isEscalated: "Escalated",
  isConfidential: "Confidential",
  isInternal: "Internal note",
  isActive: "Active",
  body: "Comment",
  comment: "Comment",
  reason: "Reason",
  title: "Title",
  description: "Description",
  filename: "File name",
  version: "Version",
  deletedAt: "Deleted on",
  closureSummary: "Closure summary",
  fullName: "Full name",
  email: "Email",
  role: "Role",
  designation: "Designation",
  phone: "Phone",
  name: "Name",
  code: "Code",
  subject: "Subject",
  requirementDescription: "What is needed",
  responseText: "Response",
};

function humanise(key: string): string {
  const words = key
    .replace(/Id$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The value as a person would say it, or `undefined` when it is an id with no name to show. */
function say(key: string, value: unknown, resolve: NameResolver): string | undefined {
  if (value === null || value === undefined || value === "") return "None";
  const idLike = key.endsWith("Id");
  // an id is only worth showing as the name it stands for; otherwise it is a technical code
  if (idLike) return resolve(key, value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (key === "priority" && value in PRIORITY_LABEL) return PRIORITY_LABEL[value as CasePriority];
    if (key === "role" && value in ROLE_LABEL) return ROLE_LABEL[value as UserRole];
    if (DATE_TIME.test(value)) return formatDateTime(value);
    if (DATE_ONLY.test(value)) return formatDate(value);
    return value;
  }
  return JSON.stringify(value);
}

/**
 * Describes an audit entry's before/after snapshots in plain language: only the fields that changed
 * (or, for a creation, what was recorded), with readable labels and names instead of ids.
 */
export function summariseChanges(
  before: unknown,
  after: unknown,
  resolve: NameResolver,
): ChangeSummary {
  const b = isRecord(before) ? before : null;
  const a = isRecord(after) ? after : null;
  if (!b && !a) return { kind: "empty", rows: [] };

  const label = (key: string) => LABELS[key] ?? humanise(key);
  const keys = [...new Set([...Object.keys(b ?? {}), ...Object.keys(a ?? {})])].filter(
    (k) => !HIDDEN.has(k),
  );
  const rows: ChangeRow[] = [];

  if (b && Object.keys(b).length > 0) {
    for (const key of keys) {
      if (JSON.stringify(b[key] ?? null) === JSON.stringify(a?.[key] ?? null)) continue;
      const was = say(key, b[key], resolve);
      const now = say(key, a?.[key], resolve);
      if (was === undefined || now === undefined) continue;
      rows.push({ key, label: label(key), before: was, after: now });
    }
    return { kind: rows.length ? "changed" : "empty", rows };
  }

  for (const key of keys) {
    const value = a?.[key];
    if (value === undefined) continue;
    const now = say(key, value, resolve);
    if (now === undefined) continue;
    rows.push({ key, label: label(key), before: null, after: now });
  }
  return { kind: rows.length ? "recorded" : "empty", rows };
}
