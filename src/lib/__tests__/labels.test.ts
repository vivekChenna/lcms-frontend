import { describe, expect, it } from "vitest";
import type { CasePriority, CaseStatus, SlaState, UserRole } from "@/lib/api/types";
import {
  PRIORITY_LABEL,
  ROLE_LABEL,
  SLA_LABEL,
  STATUS_ORDER,
  priorityTone,
  slaTone,
  statusTone,
} from "../labels";

// Exhaustive key sets typed by the generated unions: a backend enum change breaks tsc here.
const PRIORITIES: Record<CasePriority, true> = { P1: true, P2: true, P3: true, P4: true };
const SLA_STATES: Record<SlaState, true> = {
  on_track: true,
  at_risk: true,
  breached: true,
  met: true,
};
const STATUSES: Record<CaseStatus, true> = {
  Submitted: true,
  Assigned: true,
  "In Progress": true,
  "Waiting on Input": true,
  Closed: true,
};
const ROLES: Record<UserRole, true> = {
  admin: true,
  legal_manager: true,
  legal_rep: true,
  requester: true,
  viewer: true,
};
const TONES = ["neutral", "info", "success", "warning", "danger"];

describe("labels", () => {
  it("maps priorities exactly", () => {
    expect(PRIORITY_LABEL).toEqual({ P1: "Critical", P2: "High", P3: "Medium", P4: "Low" });
    expect(Object.keys(PRIORITY_LABEL).sort()).toEqual(Object.keys(PRIORITIES).sort());
  });

  it("maps SLA states exactly", () => {
    expect(SLA_LABEL).toEqual({
      on_track: "On track",
      at_risk: "At risk",
      breached: "Overdue",
      met: "Met",
    });
    expect(Object.keys(SLA_LABEL).sort()).toEqual(Object.keys(SLA_STATES).sort());
  });

  it("lists the five statuses in workflow order", () => {
    expect(STATUS_ORDER).toEqual([
      "Submitted",
      "Assigned",
      "In Progress",
      "Waiting on Input",
      "Closed",
    ]);
    expect([...STATUS_ORDER].sort()).toEqual(Object.keys(STATUSES).sort());
  });

  it("maps roles exactly", () => {
    expect(ROLE_LABEL).toEqual({
      admin: "Admin",
      legal_manager: "Legal Manager",
      legal_rep: "Legal Representative",
      requester: "Requester",
      viewer: "Viewer",
    });
    expect(Object.keys(ROLE_LABEL).sort()).toEqual(Object.keys(ROLES).sort());
  });

  it("gives every value a known tone", () => {
    for (const s of Object.keys(STATUSES) as CaseStatus[]) expect(TONES).toContain(statusTone(s));
    for (const p of Object.keys(PRIORITIES) as CasePriority[])
      expect(TONES).toContain(priorityTone(p));
    for (const s of Object.keys(SLA_STATES) as SlaState[]) expect(TONES).toContain(slaTone(s));
  });

  it("uses danger for the urgent ends", () => {
    expect(priorityTone("P1")).toBe("danger");
    expect(slaTone("breached")).toBe("danger");
    expect(slaTone("at_risk")).toBe("warning");
    expect(statusTone("Closed")).toBe("success");
  });
});
