import { describe, expect, it } from "vitest";
import type { UserRole } from "@/lib/api/types";
import { can, canSee, isLegal, rolesFor, type NavKey } from "../permissions";

const ROLES: UserRole[] = ["admin", "legal_manager", "legal_rep", "requester", "viewer"];

// Written out literally from the plan's Global Constraints (not derived from permissions.ts).
//                          admin  manager  rep    requester viewer
const EXPECTED: Record<NavKey, [boolean, boolean, boolean, boolean, boolean]> = {
  dashboard: [true, true, true, true, true],
  cases: [true, true, true, true, true],
  notifications: [true, true, true, true, true],
  "new-request": [true, false, true, true, false],
  reports: [true, true, false, false, true],
  audit: [true, true, false, false, false],
  users: [true, true, false, false, false],
  "master-data": [true, false, false, false, false],
  rules: [true, true, true, true, true],
};

describe("canSee", () => {
  for (const [key, row] of Object.entries(EXPECTED) as [NavKey, boolean[]][]) {
    ROLES.forEach((role, i) => {
      it(`${role} ${row[i] ? "can" : "cannot"} see ${key}`, () => {
        expect(canSee(role, key)).toBe(row[i]);
      });
    });
  }

  it("rolesFor lists exactly the allowed roles", () => {
    expect([...rolesFor("audit")].sort()).toEqual(["admin", "legal_manager"]);
    expect([...rolesFor("master-data")]).toEqual(["admin"]);
  });
});

describe("can.*", () => {
  it("viewer can do nothing", () => {
    for (const check of Object.values(can)) expect(check("viewer")).toBe(false);
    expect(isLegal("viewer")).toBe(false);
  });

  it("manager cannot edit a case but can assign and change priority", () => {
    expect(can.editCase("legal_manager")).toBe(false);
    expect(can.assign("legal_manager")).toBe(true);
    expect(can.changePriority("legal_manager")).toBe(true);
  });

  it("only legal_rep can raise an information request", () => {
    for (const role of ROLES) expect(can.raiseInfoRequest(role)).toBe(role === "legal_rep");
  });

  it("matches the case-action matrix", () => {
    expect(ROLES.filter(can.editCase)).toEqual(["admin", "legal_rep", "requester"]);
    expect(ROLES.filter(can.assign)).toEqual(["admin", "legal_manager"]);
    expect(ROLES.filter(can.acceptOrReject)).toEqual(["legal_manager", "legal_rep"]);
    expect(ROLES.filter(can.escalate)).toEqual(["admin", "legal_manager", "legal_rep"]);
    expect(ROLES.filter(can.close)).toEqual(["admin", "legal_manager", "legal_rep"]);
    expect(ROLES.filter(can.seeInternalComments)).toEqual(["admin", "legal_manager", "legal_rep"]);
    expect(ROLES.filter(can.editUsers)).toEqual(["admin"]);
    expect(ROLES.filter(can.editRules)).toEqual(["admin"]);
    expect(ROLES.filter(isLegal)).toEqual(["admin", "legal_manager", "legal_rep"]);
  });
});
