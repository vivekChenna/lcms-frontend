import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { invalidateCase, invalidateCaseSubresources } from "../invalidate";

const keysOf = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.map((c) => (c[0] as { queryKey: unknown[] }).queryKey);

describe("invalidateCase", () => {
  it("invalidates exactly the five case-affecting prefixes", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    invalidateCase(qc, "c1");
    expect(keysOf(spy)).toEqual([
      ["case", "c1"],
      ["cases"],
      ["dashboard"],
      ["case-audit", "c1"],
      ["notifications"],
    ]);
  });
});

describe("invalidateCaseSubresources", () => {
  it("adds comments, documents, document versions and information requests to the case keys", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    invalidateCaseSubresources(qc, "c1");
    const keys = keysOf(spy);
    expect(keys).toHaveLength(9);
    expect(keys).toEqual(
      expect.arrayContaining([
        ["comments", "c1"],
        ["documents", "c1"],
        ["document-versions"],
        ["info-requests", "c1"],
        ["case", "c1"],
        ["cases"],
        ["dashboard"],
        ["case-audit", "c1"],
        ["notifications"],
      ]),
    );
  });

  it("matches cached queries that carry extra key parts", async () => {
    const qc = new QueryClient();
    qc.setQueryData(["case-audit", "c1", { page: 2 }], 1);
    qc.setQueryData(["case-audit", "c2", {}], 1);
    invalidateCase(qc, "c1");
    expect(qc.getQueryState(["case-audit", "c1", { page: 2 }])?.isInvalidated).toBe(true);
    expect(qc.getQueryState(["case-audit", "c2", {}])?.isInvalidated).toBe(false);
  });
});
