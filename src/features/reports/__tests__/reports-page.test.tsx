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
import type { UserRole } from "@/lib/api/types";
import { makeProfile } from "@/test/render";
import { ReportsPage } from "../reports-page";
import { reportsSearchSchema } from "../search-params";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

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

function slaBody(overrides: Record<string, unknown> = {}) {
  return {
    closedOnTime: 3,
    closedLate: 1,
    openOnTrack: 5,
    openAtRisk: 1,
    openBreached: 0,
    compliancePercent: 75,
    ...overrides,
  };
}

function withLookupDefaults(handler: (url: string) => Response | undefined) {
  return async (url: string) => {
    const custom = handler(url);
    if (custom) return custom;
    if (/\/(case-categories|case-types|departments|entities|business-units)(\?|$)/.test(url)) {
      return json([]);
    }
    if (/\/users\?/.test(url)) return json({ items: [], total: 0, page: 1, pageSize: 100 });
    return json({});
  };
}

function renderAt(
  role: UserRole,
  initialSearch = "",
  handler: (url: string) => Response | undefined = () => undefined,
) {
  fetchMock.mockImplementation(withLookupDefaults(handler));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(["me"], makeProfile({ role }));
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const reports = createRoute({
    getParentRoute: () => rootRoute,
    path: "/reports",
    validateSearch: reportsSearchSchema,
    component: ReportsPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([reports]),
    history: createMemoryHistory({ initialEntries: [`/reports${initialSearch}`] }),
  });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
  return { router };
}

const urls = () => fetchMock.mock.calls.map((c) => String(c[0]));

describe("ReportsPage", () => {
  it("a viewer sees the page with the SLA compliance percent", async () => {
    renderAt("viewer", "", (url) =>
      url.includes("/reports/sla-compliance") && !url.includes("export")
        ? json(slaBody())
        : undefined,
    );
    expect(await screen.findByText("75% compliant")).toBeInTheDocument();
  });

  it("renders the empty-compliance text when compliancePercent is null", async () => {
    renderAt("admin", "", (url) =>
      url.includes("/reports/sla-compliance") && !url.includes("export")
        ? json(slaBody({ compliancePercent: null, closedOnTime: 0, closedLate: 0 }))
        : undefined,
    );
    expect(await screen.findByText("No closed cases yet")).toBeInTheDocument();
  });

  it("setting from > to shows the inline error and fires no report request for that range", async () => {
    renderAt("admin", "?createdFrom=2026-10-10&createdTo=2026-10-01", (url) =>
      url.includes("/reports/sla-compliance") && !url.includes("export")
        ? json(slaBody())
        : undefined,
    );
    expect(await screen.findByText(/must not be after/i)).toBeInTheDocument();
    expect(urls().some((u) => u.includes("/reports/sla-compliance"))).toBe(false);
  });

  it("exports the ageing report with the current filters", async () => {
    renderAt("admin", "?status=Submitted", (url) => {
      if (url.includes("/reports/ageing/export")) {
        return new Response("bucket,count\n0-7,2", {
          status: 200,
          headers: { "Content-Disposition": 'attachment; filename="ageing.csv"' },
        });
      }
      if (url.includes("/reports/ageing") && !url.includes("export")) {
        return json([{ bucket: "0-7", count: 2 }]);
      }
      return undefined;
    });

    await userEvent.click(await screen.findByRole("tab", { name: /^ageing$/i }));
    await userEvent.click(await screen.findByRole("button", { name: /export csv/i }));

    await waitFor(() =>
      expect(
        urls().some((u) => u.includes("/reports/ageing/export") && u.includes("status=Submitted")),
      ).toBe(true),
    );
  });

  it("one report's 500 does not hide the others", async () => {
    renderAt("admin", "", (url) => {
      if (url.includes("/reports/sla-compliance") && !url.includes("export")) {
        return json({ error: { code: "INTERNAL", message: "Something broke" } }, 500);
      }
      if (url.includes("/reports/ageing") && !url.includes("export")) {
        return json([{ bucket: "0-7", count: 2 }]);
      }
      return undefined;
    });

    expect(await screen.findByText(/something went wrong|something broke/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /^ageing$/i }));
    await waitFor(() => expect(screen.queryByText(/no open cases/i)).not.toBeInTheDocument());
  });
});
