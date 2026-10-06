import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserRole } from "@/lib/api/types";
import { makeProfile } from "@/test/render";
import { nameOf, useCategories, useClosureOutcomes, useLegalReps } from "../lookups";

const fetchMock = vi.fn();
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function wrapperFor(role: UserRole) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(["me"], makeProfile({ role }));
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

const urls = () => fetchMock.mock.calls.map((c) => String(c[0]));

describe("useLegalReps", () => {
  it("makes no request for a requester", async () => {
    const { result } = renderHook(() => useLegalReps(), { wrapper: wrapperFor("requester") });
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("loads the active legal reps for a manager", async () => {
    fetchMock.mockResolvedValue(
      json({ items: [{ id: "r1", fullName: "Rep One" }], total: 1, page: 1, pageSize: 100 }),
    );
    const { result } = renderHook(() => useLegalReps(), { wrapper: wrapperFor("legal_manager") });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.data?.[0]?.id).toBe("r1");
    expect(urls()).toHaveLength(1);
    expect(urls()[0]).toContain("/users?role=legal_rep&isActive=true&pageSize=100");
  });
});

describe("simple lookups", () => {
  it("fetch their endpoint", async () => {
    fetchMock.mockImplementation(async () => json([{ id: "a", name: "A", isActive: true }]));
    const w = wrapperFor("requester");
    const cats = renderHook(() => useCategories(), { wrapper: w });
    const outcomes = renderHook(() => useClosureOutcomes(), { wrapper: w });
    await waitFor(() => expect(cats.result.current.data).toHaveLength(1));
    await waitFor(() => expect(outcomes.result.current.data).toHaveLength(1));
    expect(urls().some((u) => u.endsWith("/case-categories"))).toBe(true);
    expect(urls().some((u) => u.endsWith("/closure-outcomes"))).toBe(true);
  });
});

describe("nameOf", () => {
  const list = [{ id: "a", name: "Alpha" }];
  it("finds a name", () => expect(nameOf(list, "a")).toBe("Alpha"));
  it("returns a dash for an unknown, empty or missing id or list", () => {
    expect(nameOf(list, "zzz")).toBe("—");
    expect(nameOf(list, null)).toBe("—");
    expect(nameOf(undefined, "a")).toBe("—");
  });
});
