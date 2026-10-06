import type { CasePriority, CaseStatus, SlaState, UserRole } from "@/lib/api/types";

// The only place backend enum values are turned into display text and tones.
export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const PRIORITY_LABEL: Record<CasePriority, string> = {
  P1: "Critical",
  P2: "High",
  P3: "Medium",
  P4: "Low",
};

export const SLA_LABEL: Record<SlaState, string> = {
  on_track: "On track",
  at_risk: "At risk",
  breached: "Overdue",
  met: "Met",
};

export const STATUS_ORDER: CaseStatus[] = [
  "Submitted",
  "Assigned",
  "In Progress",
  "Waiting on Input",
  "Closed",
];

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  legal_manager: "Legal Manager",
  legal_rep: "Legal Representative",
  requester: "Requester",
  viewer: "Viewer",
};

const STATUS_TONE: Record<CaseStatus, Tone> = {
  Submitted: "neutral",
  Assigned: "info",
  "In Progress": "info",
  "Waiting on Input": "warning",
  Closed: "success",
};

const PRIORITY_TONE: Record<CasePriority, Tone> = {
  P1: "danger",
  P2: "warning",
  P3: "info",
  P4: "neutral",
};

const SLA_TONE: Record<SlaState, Tone> = {
  on_track: "success",
  at_risk: "warning",
  breached: "danger",
  met: "success",
};

export const statusTone = (status: CaseStatus): Tone => STATUS_TONE[status];
export const priorityTone = (priority: CasePriority): Tone => PRIORITY_TONE[priority];
export const slaTone = (state: SlaState): Tone => SLA_TONE[state];
