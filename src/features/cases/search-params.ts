import { z } from "zod";

const CASE_STATUSES = [
  "Submitted",
  "Assigned",
  "In Progress",
  "Waiting on Input",
  "Closed",
] as const;
const CASE_PRIORITIES = ["P1", "P2", "P3", "P4"] as const;
const SLA_STATES = ["on_track", "at_risk", "breached", "met"] as const;

/** Mirrors the backend's `caseListQuerySchema`; invalid values are dropped, never thrown. */
export const casesSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20).default(20),
  status: z.enum(CASE_STATUSES).optional().catch(undefined),
  priority: z.enum(CASE_PRIORITIES).optional().catch(undefined),
  categoryId: z.string().optional(),
  caseTypeId: z.string().optional(),
  entityId: z.string().optional(),
  businessUnitId: z.string().optional(),
  departmentId: z.string().optional(),
  assignedLegalRepId: z.string().optional(),
  search: z.string().optional(),
  slaState: z.enum(SLA_STATES).optional().catch(undefined),
  open: z.literal("true").optional().catch(undefined),
});

export type CasesSearch = z.infer<typeof casesSearchSchema>;
