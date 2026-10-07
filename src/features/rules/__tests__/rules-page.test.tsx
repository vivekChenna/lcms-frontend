import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserRole } from "@/lib/api/types";
import { makeProfile } from "@/test/render";
import { RulesPage } from "../rules-page";

afterEach(cleanup);

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

function rule(overrides: Record<string, unknown> = {}) {
  return {
    id: "r1",
    matchCriteria: { categoryId: "cat-1" },
    targetLegalRepId: "rep-1",
    priorityOrder: 0,
    isActive: true,
    ...overrides,
  };
}

function renderAs(role: UserRole) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith("/routing-rules")) return json([rule()]);
    if (url.includes("/case-categories"))
      return json([{ id: "cat-1", name: "Internal", isActive: true }]);
    if (url.includes("/users?"))
      return json({
        items: [{ id: "rep-1", fullName: "Rex Rep" }],
        total: 1,
        page: 1,
        pageSize: 100,
      });
    return json([]);
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(["me"], makeProfile({ role }));
  render(
    <QueryClientProvider client={qc}>
      <RulesPage />
    </QueryClientProvider>,
  );
}

describe("RulesPage", () => {
  it("a legal_manager sees the table without any mutation buttons", async () => {
    renderAs("legal_manager");
    await screen.findByText(/category: internal/i);
    expect(screen.queryByRole("button", { name: /new rule/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("an admin sees mutation buttons", async () => {
    renderAs("admin");
    await screen.findByText(/category: internal/i);
    expect(screen.getByRole("button", { name: /new rule/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
  });
});
