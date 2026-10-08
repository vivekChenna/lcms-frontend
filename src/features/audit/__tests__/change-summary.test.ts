import { describe, expect, it } from "vitest";
import { summariseChanges } from "../change-summary";

const names: Record<string, string> = {
  "rep-1": "Vivek Legal Rep",
  "dept-1": "Finance",
};
const resolve = (_key: string, value: unknown) => names[String(value)];

describe("summariseChanges", () => {
  it("lists only the fields that changed, with plain labels and values", () => {
    const s = summariseChanges(
      { id: "c1", status: "Submitted", assignedLegalRepId: null },
      {
        id: "c1",
        status: "Assigned",
        referenceNumber: "AGC-INT-000008",
        assignedLegalRepId: "rep-1",
      },
      resolve,
    );
    expect(s.kind).toBe("changed");
    expect(s.rows).toEqual([
      { key: "status", label: "Status", before: "Submitted", after: "Assigned" },
      { key: "assignedLegalRepId", label: "Assigned to", before: "None", after: "Vivek Legal Rep" },
    ]);
  });

  it("never shows internal ids or the reference number as a change", () => {
    const s = summariseChanges(
      { id: "a", status: "Submitted" },
      { id: "a", caseId: "b", referenceNumber: "X-1", status: "Closed" },
      resolve,
    );
    expect(s.rows.map((r) => r.key)).toEqual(["status"]);
  });

  it("turns priority codes, booleans and dates into words", () => {
    const s = summariseChanges(
      { priority: "P3", isEscalated: false, deletedAt: null },
      { priority: "P1", isEscalated: true, deletedAt: "2026-10-08T10:15:00.000Z" },
      resolve,
    );
    const byKey = Object.fromEntries(s.rows.map((r) => [r.key, r]));
    expect(byKey["priority"]).toMatchObject({
      label: "Priority",
      before: "Medium",
      after: "Critical",
    });
    expect(byKey["isEscalated"]).toMatchObject({ label: "Escalated", before: "No", after: "Yes" });
    expect(byKey["deletedAt"]?.label).toBe("Deleted on");
    expect(byKey["deletedAt"]?.after).toMatch(/08 Oct 2026/);
  });

  it("describes a creation (nothing before) as recorded details", () => {
    const s = summariseChanges(
      null,
      { id: "d1", filename: "contract.pdf", version: 1, isInternal: true, departmentId: "dept-1" },
      resolve,
    );
    expect(s.kind).toBe("recorded");
    expect(s.rows).toEqual([
      { key: "filename", label: "File name", before: null, after: "contract.pdf" },
      { key: "version", label: "Version", before: null, after: "1" },
      { key: "isInternal", label: "Internal note", before: null, after: "Yes" },
      { key: "departmentId", label: "Department", before: null, after: "Finance" },
    ]);
  });

  it("drops an id it cannot turn into a name instead of showing a code", () => {
    const s = summariseChanges(
      { assignedLegalRepId: "gone" },
      { assignedLegalRepId: "other" },
      resolve,
    );
    expect(s.rows).toEqual([]);
    expect(s.kind).toBe("empty");
  });

  it("falls back to a readable label for fields it does not know", () => {
    const s = summariseChanges({ closureNoteText: "a" }, { closureNoteText: "b" }, resolve);
    expect(s.rows[0]?.label).toBe("Closure note text");
  });

  it("is empty when there is nothing to show", () => {
    expect(summariseChanges(null, null, resolve).kind).toBe("empty");
    expect(summariseChanges({ status: "A" }, { status: "A" }, resolve).kind).toBe("empty");
  });

  it("ignores input that is not an object", () => {
    expect(summariseChanges("text", 5, resolve).kind).toBe("empty");
  });
});
