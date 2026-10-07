import { describe, expect, it } from "vitest";
import { casesSearchSchema } from "../search-params";

describe("casesSearchSchema", () => {
  it("defaults page and pageSize", () => {
    expect(casesSearchSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("coerces a string page into a number", () => {
    expect(casesSearchSchema.parse({ page: "2" }).page).toBe(2);
  });

  it("drops an invalid enum value instead of throwing", () => {
    const result = casesSearchSchema.parse({ status: "Bogus", page: "2" });
    expect(result.status).toBeUndefined();
    expect(result.page).toBe(2);
  });

  it("drops an invalid priority, slaState or open value", () => {
    const result = casesSearchSchema.parse({ priority: "P9", slaState: "x", open: "false" });
    expect(result.priority).toBeUndefined();
    expect(result.slaState).toBeUndefined();
    expect(result.open).toBeUndefined();
  });

  it("keeps every valid filter field", () => {
    const input = {
      page: "3",
      pageSize: "10",
      status: "Assigned",
      priority: "P2",
      categoryId: "c1",
      caseTypeId: "t1",
      entityId: "e1",
      businessUnitId: "b1",
      departmentId: "d1",
      assignedLegalRepId: "r1",
      search: "contract",
      slaState: "breached",
      open: "true",
    };
    expect(casesSearchSchema.parse(input)).toEqual({
      page: 3,
      pageSize: 10,
      status: "Assigned",
      priority: "P2",
      categoryId: "c1",
      caseTypeId: "t1",
      entityId: "e1",
      businessUnitId: "b1",
      departmentId: "d1",
      assignedLegalRepId: "r1",
      search: "contract",
      slaState: "breached",
      open: "true",
    });
  });

  it("ignores unknown keys", () => {
    const result = casesSearchSchema.parse({ bogus: "x" });
    expect(result).not.toHaveProperty("bogus");
  });
});
