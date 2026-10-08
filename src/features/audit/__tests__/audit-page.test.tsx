import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { makeProfile } from "@/test/render";
import { AuditPage } from "../audit-page";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

let clickSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  clickSpy.mockRestore();
});

function auditRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "a1",
    caseId: "c1",
    caseReference: "AGC-INT-000001",
    actorId: "u1",
    actorName: "Ada Admin",
    actorRole: "admin",
    action: "case.closed",
    beforeValue: { status: "In Progress" },
    afterValue: { status: "Closed" },
    createdAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

function withDefaults(handler: (url: string) => Response | undefined) {
  return async (url: string) => {
    const custom = handler(url);
    if (custom) return custom;
    if (url.includes("/users?")) return json({ items: [], total: 0, page: 1, pageSize: 100 });
    return json({ items: [], total: 0, page: 1, pageSize: 20 });
  };
}

function renderAt(
  initialSearch = "",
  handler: (url: string) => Response | undefined = () => undefined,
) {
  fetchMock.mockImplementation(withDefaults(handler));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(["me"], makeProfile({ role: "admin" }));
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const audit = createRoute({
    getParentRoute: () => rootRoute,
    path: "/audit",
    validateSearch: z.object({
      page: z.coerce.number().int().min(1).catch(1).default(1),
      actorId: z.string().optional(),
      action: z.string().optional(),
      caseId: z.string().optional(),
      createdFrom: z.string().optional(),
      createdTo: z.string().optional(),
    }),
    component: AuditPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([audit]),
    history: createMemoryHistory({ initialEntries: [`/audit${initialSearch}`] }),
  });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
}

const urls = () => fetchMock.mock.calls.map((c) => String(c[0]));

describe("AuditPage", () => {
  it("blocks the request and shows an inline error when createdFrom is after createdTo", async () => {
    renderAt("?createdFrom=2026-10-10&createdTo=2026-10-01");
    expect(await screen.findByText(/must not be after/i)).toBeInTheDocument();
    expect(urls().some((u) => u.includes("/audit?") || u.endsWith("/audit"))).toBe(false);
  });

  it("export carries the same filters as the list", async () => {
    renderAt("?action=case.closed", (url) => {
      if (url.includes("/audit/export")) {
        return new Response("id\na1", {
          status: 200,
          headers: { "Content-Disposition": 'attachment; filename="audit.csv"' },
        });
      }
      if (url.includes("/audit?") || url.endsWith("/audit")) {
        return json({ items: [auditRow()], total: 1, page: 1, pageSize: 20 });
      }
      return undefined;
    });

    await screen.findByText("case.closed");
    await userEvent.click(screen.getByRole("button", { name: /export csv/i }));

    await waitFor(() =>
      expect(
        urls().some((u) => u.includes("/audit/export") && u.includes("action=case.closed")),
      ).toBe(true),
    );
  });

  it("the details drawer explains the change in plain words, with no raw data", async () => {
    renderAt("", (url) =>
      url.includes("/audit?") || url.endsWith("/audit")
        ? json({ items: [auditRow()], total: 1, page: 1, pageSize: 20 })
        : undefined,
    );

    await userEvent.click(await screen.findByRole("button", { name: /^details$/i }));
    expect(await screen.findByRole("list", { name: /what changed/i })).toBeInTheDocument();
    expect(screen.queryByText(/"status"/)).not.toBeInTheDocument();
    expect(screen.queryByText(/technical details/i)).not.toBeInTheDocument();
  });
});
