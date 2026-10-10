import { describe, expect, it } from "vitest";
import { canWriteToCase } from "../can-write";

const me = (role: string, id = "me") => ({ id, role }) as never;
const c = (status: string, assignedLegalRepId: string | null = "rep-a") =>
  ({ status, assignedLegalRepId }) as never;

describe("canWriteToCase", () => {
  it("lets a rep write only on their own accepted case", () => {
    expect(canWriteToCase(me("legal_rep", "rep-a"), c("In Progress"))).toBe(true);
    expect(canWriteToCase(me("legal_rep", "rep-a"), c("Waiting on Input"))).toBe(true);
    // not accepted yet
    expect(canWriteToCase(me("legal_rep", "rep-a"), c("Assigned"))).toBe(false);
    // another rep's case
    expect(canWriteToCase(me("legal_rep", "rep-b"), c("In Progress"))).toBe(false);
  });

  it("never lets anyone write to a closed case, and never a viewer", () => {
    for (const role of ["admin", "legal_manager", "legal_rep", "requester"]) {
      expect(canWriteToCase(me(role, "rep-a"), c("Closed"))).toBe(false);
    }
    expect(canWriteToCase(me("viewer"), c("In Progress"))).toBe(false);
  });

  it("does not tie requesters, managers and admins to the assignee", () => {
    for (const role of ["requester", "legal_manager", "admin"]) {
      expect(canWriteToCase(me(role), c("Submitted", null))).toBe(true);
      expect(canWriteToCase(me(role), c("In Progress"))).toBe(true);
    }
  });
});
