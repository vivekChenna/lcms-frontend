import { z } from "zod";

const CASE_STATUSES = [
  "Submitted",
  "Assigned",
  "In Progress",
  "Waiting on Input",
  "Closed",
] as const;
const CASE_PRIORITIES = ["P1", "P2", "P3", "P4"] as const;

/** Mirrors the backend's reportQuerySchema; invalid values are dropped, never thrown. */
export const reportsSearchSchema = z.object({
  status: z.enum(CASE_STATUSES).optional().catch(undefined),
  priority: z.enum(CASE_PRIORITIES).optional().catch(undefined),
  categoryId: z.string().optional(),
  caseTypeId: z.string().optional(),
  entityId: z.string().optional(),
  businessUnitId: z.string().optional(),
  departmentId: z.string().optional(),
  assignedLegalRepId: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
});

export type ReportsSearch = z.infer<typeof reportsSearchSchema>;
