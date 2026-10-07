import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAcceptCase, useAssignCase, useRejectCase } from "../use-case-actions";

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper, invalidateSpy };
}

const urls = () => fetchMock.mock.calls.map((c) => String(c[0]));
const init = (i: number) => fetchMock.mock.calls[i]?.[1] as RequestInit | undefined;

describe("useAcceptCase", () => {
  it("PATCHes /cases/:id/accept with an empty body and invalidates the case", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1", status: "In Progress" }));
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useAcceptCase("c1"), { wrapper: Wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls()[0]).toContain("/cases/c1/accept");
    expect(init(0)?.method).toBe("PATCH");
    expect(JSON.parse(String(init(0)?.body ?? "{}"))).toEqual({});
    // invalidateCase touches case(id), cases, dashboard, case-audit, notifications
    expect(invalidateSpy).toHaveBeenCalledTimes(5);
  });

  it("surfaces the backend error message on failure", async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: "CONFLICT", message: "Case is not awaiting acceptance" } }, 409),
    );
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useAcceptCase("c1"), { wrapper: Wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Case is not awaiting acceptance");
  });
});

describe("useRejectCase", () => {
  it("PATCHes /cases/:id/reject with the reason", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1", status: "Submitted" }));
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useRejectCase("c1"), { wrapper: Wrapper });

    result.current.mutate("not my department");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls()[0]).toContain("/cases/c1/reject");
    expect(init(0)?.method).toBe("PATCH");
    expect(JSON.parse(String(init(0)?.body))).toEqual({ reason: "not my department" });
    expect(invalidateSpy).toHaveBeenCalledTimes(5);
  });
});

describe("useAssignCase", () => {
  it("PATCHes /cases/:id/assign with the target rep", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1", status: "Assigned" }));
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useAssignCase("c1"), { wrapper: Wrapper });

    result.current.mutate("rep-2");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls()[0]).toContain("/cases/c1/assign");
    expect(init(0)?.method).toBe("PATCH");
    expect(JSON.parse(String(init(0)?.body))).toEqual({ targetLegalRepId: "rep-2" });
    expect(invalidateSpy).toHaveBeenCalledTimes(5);
  });
});
