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
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationBell } from "../notification-bell";
import { useMarkAllRead } from "../use-notifications";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function notification(overrides: Record<string, unknown> = {}) {
  return {
    id: "n1",
    type: "case.assigned",
    title: "Case assigned",
    body: "You have been assigned a new case.",
    relatedCaseId: "c1",
    relatedCaseReference: "AGC-INT-000001",
    isRead: false,
    readAt: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderWithRouter(ui: ReactNode, qc: QueryClient) {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        {ui}
        <Outlet />
      </>
    ),
  });
  const caseRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/cases/$caseId",
    component: () => <div data-testid="case-page" />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([caseRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
  return router;
}

describe("NotificationBell", () => {
  it("shows the unread count and caps it at 99+", async () => {
    fetchMock.mockImplementation(async () =>
      json({ items: [], total: 150, page: 1, pageSize: 1, unreadCount: 150 }),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderWithRouter(<NotificationBell />, qc);
    expect(await screen.findByText("99+")).toBeInTheDocument();
  });

  it("shows a small exact unread count", async () => {
    fetchMock.mockImplementation(async () =>
      json({ items: [], total: 3, page: 1, pageSize: 1, unreadCount: 3 }),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderWithRouter(<NotificationBell />, qc);
    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("clicking an item marks it read once and navigates to its case", async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/notifications/n1/read")) return json(notification({ isRead: true }));
      return json({ items: [notification()], total: 1, page: 1, pageSize: 5, unreadCount: 1 });
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = renderWithRouter(<NotificationBell />, qc);

    await userEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    await userEvent.click(await screen.findByText("Case assigned"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/cases/c1"));
    const readCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes("/notifications/n1/read"),
    );
    expect(readCalls).toHaveLength(1);
  });

  it("keeps the popup compact: the title and time, not the full wording", async () => {
    fetchMock.mockImplementation(async () =>
      json({ items: [notification()], total: 1, page: 1, pageSize: 5, unreadCount: 1 }),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderWithRouter(<NotificationBell />, qc);

    await userEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    expect(await screen.findByText("Case assigned")).toBeInTheDocument();
    expect(screen.queryByText("You have been assigned a new case.")).not.toBeInTheDocument();
  });

  it("rolls back the optimistic read on a 500", async () => {
    let readAttempted = false;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/notifications/n1/read")) {
        readAttempted = true;
        return json({ error: { code: "INTERNAL", message: "boom" } }, 500);
      }
      return json({ items: [notification()], total: 1, page: 1, pageSize: 5, unreadCount: 1 });
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderWithRouter(<NotificationBell />, qc);

    await userEvent.click(await screen.findByRole("button", { name: /notifications/i }));
    await userEvent.click(await screen.findByText("Case assigned"));

    await waitFor(() => expect(readAttempted).toBe(true));
    // after rollback + refetch, the badge still shows the original unread count
    await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
  });
});

describe("useMarkAllRead", () => {
  it("sends PATCH /notifications/read-all with an empty body", async () => {
    fetchMock.mockImplementation(async () => json({ updated: 2 }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { renderHook, waitFor: rhWaitFor } = await import("@testing-library/react");
    const { result } = renderHook(() => useMarkAllRead(), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });

    result.current.mutate();
    await rhWaitFor(() => expect(result.current.isSuccess).toBe(true));

    const call = fetchMock.mock.calls.find((c) => String(c[0]).endsWith("/notifications/read-all"));
    expect(call).toBeDefined();
    expect((call![1] as RequestInit).method).toBe("PATCH");
    expect(JSON.parse(String((call![1] as RequestInit).body))).toEqual({});
  });
});
