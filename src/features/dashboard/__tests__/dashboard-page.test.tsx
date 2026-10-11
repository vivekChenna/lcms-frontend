import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserRole } from "@/lib/api/types";
import { makeProfile } from "@/test/render";
import { DashboardPage } from "../dashboard-page";
import { managerDashboard, repDashboard, requesterDashboard, viewerDashboard } from "./fixtures";

afterEach(cleanup);

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

/** A router with a real "/" and "/cases" so <Link> hrefs resolve and clicking them navigates. */
function renderAt(role: UserRole) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(["me"], makeProfile({ role }));
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const home = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: DashboardPage,
  });
  const cases = createRoute({
    getParentRoute: () => rootRoute,
    path: "/cases",
    component: () => <div data-testid="cases-page">cases page</div>,
  });
  const caseDetail = createRoute({
    getParentRoute: () => rootRoute,
    path: "/cases/$caseId",
    component: () => <div data-testid="case-detail-page">case</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([home, cases, caseDetail]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
  return { router };
}

describe("DashboardPage", () => {
  it("opens the case when anywhere on a my-assigned-cases row is clicked", async () => {
    fetchMock.mockResolvedValue(json(repDashboard()));
    const { router } = renderAt("legal_rep");
    const row = (await screen.findByText("[Demo] Lease renewal advice")).closest(
      "tr",
    ) as HTMLElement;
    await userEvent.click(within(row).getByText("[Demo] Lease renewal advice"));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/cases\/[^/]+$/));
  });

  it("does not open the case when Accept is clicked", async () => {
    fetchMock.mockResolvedValue(json(repDashboard()));
    const { router } = renderAt("legal_rep");
    const row = (await screen.findByText("[Demo] Lease renewal advice")).closest(
      "tr",
    ) as HTMLElement;
    await userEvent.click(within(row).getByRole("button", { name: /accept/i }));
    expect(router.state.location.pathname).toBe("/");
  });

  it("shows a skeleton while loading, then 7 tiles for a requester, no legal-only panels", async () => {
    let resolve!: (v: Response) => void;
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
    renderAt("requester");

    expect((await screen.findAllByTestId("tile-skeleton")).length).toBeGreaterThan(0);

    resolve(json(requesterDashboard()));
    await waitFor(() => expect(screen.getByTestId("dashboard-tiles")).toBeInTheDocument());
    const tiles = within(screen.getByTestId("dashboard-tiles"));

    for (const label of [
      "Total",
      "Open",
      "Awaiting acceptance",
      "Waiting on input",
      "Overdue",
      "On time",
      "Closed",
    ]) {
      expect(tiles.getByText(label)).toBeInTheDocument();
    }
    expect(tiles.queryByText("Assigned to me")).not.toBeInTheDocument();
    expect(tiles.queryByText("Unassigned")).not.toBeInTheDocument();
    expect(screen.queryByText(/my assigned cases/i)).not.toBeInTheDocument();
  });

  it("shows only the 7 common tiles and no manager panels for a viewer", async () => {
    fetchMock.mockResolvedValue(json(viewerDashboard()));
    renderAt("viewer");
    await waitFor(() => expect(screen.getByTestId("dashboard-tiles")).toBeInTheDocument());
    expect(
      within(screen.getByTestId("dashboard-tiles")).queryByText("Assigned to me"),
    ).not.toBeInTheDocument();
  });

  it("shows the rep's assigned-to-me/unassigned tiles and the my-assigned-cases panel with Accept/Reject only on Assigned rows", async () => {
    fetchMock.mockResolvedValue(json(repDashboard()));
    renderAt("legal_rep");

    await waitFor(() => expect(screen.getByText("Assigned to me")).toBeInTheDocument());
    expect(screen.getByText("Unassigned")).toBeInTheDocument();

    const assignedRow = screen
      .getByText("[Demo] Lease renewal advice")
      .closest("li,tr") as HTMLElement;
    expect(within(assignedRow).getByRole("button", { name: /accept/i })).toBeInTheDocument();

    const inProgressRow = screen.getByText("[Demo] NDA review").closest("li,tr") as HTMLElement;
    expect(
      within(inProgressRow).queryByRole("button", { name: /accept/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the manager panels (open caseload, unassigned, awaiting acceptance)", async () => {
    fetchMock.mockResolvedValue(json(managerDashboard()));
    renderAt("legal_manager");

    await waitFor(() => expect(screen.getAllByText("Vivek Legal Rep").length).toBeGreaterThan(0));
    expect(screen.getByText("[Demo] Vendor payment dispute")).toBeInTheDocument();
    expect(screen.getByText("[Demo] Supplier contract")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^assign$/i })).toBeInTheDocument();
  });

  it("opens the case when an unassigned row is clicked, but Assign works in place", async () => {
    fetchMock.mockResolvedValue(json(managerDashboard()));
    const { router } = renderAt("legal_manager");
    const row = (await screen.findByText("[Demo] Vendor payment dispute")).closest("tr") as HTMLElement;

    await userEvent.click(within(row).getByRole("button", { name: /^assign$/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    await userEvent.keyboard("{Escape}");

    await userEvent.click(within(row).getByText("[Demo] Vendor payment dispute"));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/cases\/[^/]+$/));
  });

  it("links the Overdue tile to /cases with the backend's replay filter", async () => {
    fetchMock.mockResolvedValue(json(repDashboard()));
    const { router } = renderAt("legal_rep");

    await waitFor(() => expect(screen.getByTestId("dashboard-tiles")).toBeInTheDocument());
    const overdueTile = within(screen.getByTestId("dashboard-tiles"))
      .getByText("Overdue")
      .closest("a")!;
    expect(overdueTile).toHaveAttribute("href", expect.stringContaining("slaState=breached"));

    await userEvent.click(overdueTile);
    await waitFor(() => expect(router.state.location.pathname).toBe("/cases"));
  });

  it("shows an error state with Retry on failure", async () => {
    fetchMock.mockResolvedValueOnce(json({ error: { code: "SERVER", message: "boom" } }, 500));
    renderAt("admin");

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    fetchMock.mockResolvedValueOnce(json(managerDashboard()));
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    await waitFor(() => expect(screen.getByText("Total")).toBeInTheDocument());
  });
});
