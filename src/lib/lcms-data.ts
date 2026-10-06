import type { UserRole } from "./lcms-api";

export type CaseStatus = "Submitted" | "Assigned" | "In Progress" | "Waiting on Input" | "Closed";
export type Priority = "Critical" | "High" | "Medium" | "Low";

export interface LegalCase {
  id: string;
  title: string;
  category: string;
  type: string;
  entity: string;
  department: string;
  assignee: string;
  designation: string;
  status: CaseStatus;
  priority: Priority;
  target: string;
  sla: "On track" | "At risk" | "Overdue";
  escalated?: boolean;
}

export const cases: LegalCase[] = [
  { id: "LC-2026-184", title: "Eastern Region fleet supply agreement", category: "Internal", type: "Contract Review", entity: "Algihaz Holding", department: "Procurement", assignee: "Faisal Al-Qahtani", designation: "Senior Legal Counsel", status: "In Progress", priority: "High", target: "30 Sep 2026", sla: "At risk", escalated: true },
  { id: "LC-2026-183", title: "Vendor compliance assessment", category: "Internal", type: "Compliance", entity: "Saudi Gulf", department: "Operations", assignee: "Reem Al-Dossary", designation: "Legal Counsel", status: "Waiting on Input", priority: "Medium", target: "02 Oct 2026", sla: "On track" },
  { id: "LC-2026-181", title: "Warehouse lease renewal", category: "Internal", type: "Real Estate", entity: "Algihaz Contracting", department: "Facilities", assignee: "Faisal Al-Qahtani", designation: "Senior Legal Counsel", status: "Assigned", priority: "High", target: "28 Sep 2026", sla: "Overdue" },
  { id: "LC-2026-179", title: "Employment policy amendment", category: "Internal", type: "Employment", entity: "Algihaz Holding", department: "People & Culture", assignee: "Lina Al-Zahrani", designation: "Legal Specialist", status: "Submitted", priority: "Medium", target: "05 Oct 2026", sla: "On track" },
  { id: "LC-2026-176", title: "Subcontractor claim review", category: "Dispute", type: "Claims", entity: "Algihaz Contracting", department: "Projects", assignee: "Reem Al-Dossary", designation: "Legal Counsel", status: "In Progress", priority: "Critical", target: "27 Sep 2026", sla: "Overdue", escalated: true },
  { id: "LC-2026-171", title: "Trademark registration renewal", category: "Corporate", type: "Intellectual Property", entity: "Algihaz Holding", department: "Corporate Affairs", assignee: "Lina Al-Zahrani", designation: "Legal Specialist", status: "Closed", priority: "Low", target: "20 Sep 2026", sla: "On track" },
];

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  legal_manager: "Legal Manager",
  legal_rep: "Legal Representative",
  requester: "Requester",
  viewer: "Viewer",
};