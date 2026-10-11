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
import { managerDashboard } from "@/features/dashboard/__tests__/fixtures";
import { casesSearchSchema } from "../search-params";
import { CasesPage } from "../cases-page";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

/** Lookup lists (categories, case types, departments, entities, business units) are plain
 * arrays; only `/cases` and `/cases/export` return the paginated/CSV shapes a test overrides. */
function withLookupDefaults(handler: (url: string) => Response | Promise<Response>) {
  return (url: string) => {
    if (/\/(case-categories|case-types|departments|entities|business-units)(\?|$)/.test(url)) {
      return Promise.resolve(json([]));
    }
    if (/\/users\?/.test(url)) {
      return Promise.resolve(json({ items: [], total: 0, page: 1, pageSize: 100 }));
    }
    return Promise.resolve(handler(url));
  };
}

// jsdom warns "navigation to another Document" on a real anchor click; stub it like
// client.test.ts does, so the download trigger doesn't actually navigate.
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

const caseRow = (overrides: Record<string, unknown> = {}) => ({
  id: "c1",
  referenceNumber: "AGC-INT-000001",
  title: "Vendor dispute",
  categoryName: "Internal",
  caseTypeName: "Legal Query",
  requesterName: "Vivek Requester",
  assignedLegalRepName: null,
  priority: "P2",
  status: "Submitted",
  slaState: "on_track",
  resolutionDueAt: "2026-10-09T20:12:18.796Z",
  createdAt: "2026-10-06T20:12:18.796Z",
  isConfidential: false,
  isEscalated: false,
  ...overrides,
});

function renderAt(role: UserRole, initialSearch = "") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(["me"], makeProfile({ role }));
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const cases = createRoute({
    getParentRoute: () => rootRoute,
    path: "/cases",
    validateSearch: casesSearchSchema,
    component: CasesPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([cases]),
    history: createMemoryHistory({ initialEntries: [`/cases${initialSearch}`] }),
  });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
  return { router };
}

const urls = () => fetchMock.mock.calls.map((c) => String(c[0]));
const lastListUrl = () =>
  urls()
    .filter((u) => u.includes("/cases") && !u.includes("/export"))
    .at(-1);

describe("CasesPage summary (BRD UI-08)", () => {
  const handler = (url: string) =>
    url.includes("/dashboard")
      ? json(managerDashboard())
      : json({ items: [caseRow()], total: 1, page: 1, pageSize: 20 });

  it("shows the overdue alert and the workflow above the list, not below it", async () => {
    fetchMock.mockImplementation(withLookupDefaults(handler));
    renderAt("legal_manager");
    const flow = await screen.findByRole("navigation", { name: /case workflow/i });
    const alert = screen.getByRole("link", { name: /review overdue/i });
    const list = await screen.findByText("AGC-INT-000001");
    expect(alert.compareDocumentPosition(flow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(flow.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("draws every status as a stage with its count, in workflow order", async () => {
    fetchMock.mockImplementation(withLookupDefaults(handler));
    renderAt("legal_manager");
    const flow = await screen.findByRole("navigation", { name: /case workflow/i });
    const stages = within(flow).getAllByRole("link");
    expect(stages.map((a) => a.getAttribute("data-stage"))).toEqual([
      "Submitted",
      "Assigned",
      "In Progress",
      "Waiting on Input",
      "Closed",
    ]);
  });

  it("a stage filters this very list to its status", async () => {
    fetchMock.mockImplementation(withLookupDefaults(handler));
    const { router } = renderAt("legal_manager");
    const flow = await screen.findByRole("navigation", { name: /case workflow/i });
    await userEvent.click(within(flow).getByRole("link", { name: /^submitted/i }));
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ status: "Submitted" }),
    );
    await waitFor(() => expect(lastListUrl()).toContain("status=Submitted"));
  });

  it("marks the stage the list is filtered to", async () => {
    fetchMock.mockImplementation(withLookupDefaults(handler));
    renderAt("legal_manager", "?status=Submitted");
    const flow = await screen.findByRole("navigation", { name: /case workflow/i });
    expect(within(flow).getByRole("link", { name: /^submitted/i })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(within(flow).getByRole("link", { name: /^closed/i })).not.toHaveAttribute("data-active");
  });

  it("keeps every BRD summary count one click away, as filters", async () => {
    fetchMock.mockImplementation(withLookupDefaults(handler));
    renderAt("legal_manager");
    const counts = await screen.findByRole("list", { name: /case counts/i });
    for (const name of [
      /^all cases/i,
      /^open/i,
      /^awaiting acceptance/i,
      /^waiting on input/i,
      /^on time/i,
      /^unassigned/i,
      /^assigned to me/i,
    ]) {
      expect(within(counts).getByRole("link", { name })).toBeInTheDocument();
    }
    // overdue has the alert above, so it is not repeated while there is something overdue
    expect(within(counts).queryByRole("link", { name: /^overdue/i })).not.toBeInTheDocument();
  });

  it("does not offer the legal-only counts to a requester", async () => {
    fetchMock.mockImplementation(withLookupDefaults(handler));
    renderAt("requester");
    const counts = await screen.findByRole("list", { name: /case counts/i });
    expect(within(counts).queryByRole("link", { name: /^unassigned/i })).not.toBeInTheDocument();
    expect(
      within(counts).queryByRole("link", { name: /^assigned to me/i }),
    ).not.toBeInTheDocument();
  });

  it("a count chip applies its filter to this very list", async () => {
    fetchMock.mockImplementation(withLookupDefaults(handler));
    const { router } = renderAt("legal_manager");
    const counts = await screen.findByRole("list", { name: /case counts/i });
    await userEvent.click(within(counts).getByRole("link", { name: /^open/i }));
    await waitFor(() => expect(router.state.location.search).toHaveProperty("open"));
  });

  it("the overdue alert filters the list to overdue cases", async () => {
    fetchMock.mockImplementation(withLookupDefaults(handler));
    const { router } = renderAt("legal_manager");
    await userEvent.click(await screen.findByRole("link", { name: /review overdue/i }));
    await waitFor(() => expect(router.state.location.search).toHaveProperty("slaState"));
  });

  it("shows the hidden filters as chips that each remove just that filter", async () => {
    fetchMock.mockImplementation(withLookupDefaults(handler));
    const { router } = renderAt("legal_manager", "?status=Submitted&open=%22true%22");
    const chips = await screen.findByRole("list", { name: /active filters/i });
    // status is already a highlighted control in the toolbar, so it gets no chip
    expect(within(chips).queryByText("Status: Submitted")).not.toBeInTheDocument();
    await userEvent.click(within(chips).getByRole("button", { name: /remove filter open only/i }));
    await waitFor(() => expect(router.state.location.search).not.toHaveProperty("open"));
    expect(router.state.location.search).toHaveProperty("status", "Submitted");
  });

  it("highlights an active filter in the toolbar with its value", async () => {
    fetchMock.mockImplementation(withLookupDefaults(handler));
    renderAt("legal_manager", "?status=Submitted");
    expect(await screen.findByRole("combobox", { name: "Status" })).toHaveTextContent(
      /Statuss*Submitted/,
    );
    expect(screen.getByRole("combobox", { name: "Priority" })).toHaveTextContent(/^Priority$/);
  });

  it("leaves the list working when the summary cannot be loaded", async () => {
    fetchMock.mockImplementation(
      withLookupDefaults((url) =>
        url.includes("/dashboard")
          ? json({ error: { code: "INTERNAL", message: "boom" } }, 500)
          : json({ items: [caseRow()], total: 1, page: 1, pageSize: 20 }),
      ),
    );
    renderAt("legal_manager");
    expect(await screen.findByText("AGC-INT-000001")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-tiles")).not.toBeInTheDocument();
  });
});

describe("CasesPage", () => {
  it("requests the typed search and resets to page 1 after the debounce", async () => {
    fetchMock.mockImplementation(
      withLookupDefaults(() => json({ items: [], total: 0, page: 1, pageSize: 20 })),
    );
    const { router } = renderAt("admin", "?page=3");

    await waitFor(() => expect(lastListUrl()).toContain("page=3"));
    await userEvent.type(screen.getByLabelText(/search/i), "vendor");

    await waitFor(() => expect(lastListUrl()).toContain("search=vendor"), { timeout: 2000 });
    expect(lastListUrl()).toContain("page=1");
    expect(router.state.location.search).toMatchObject({ search: "vendor", page: 1 });
  });

  it("resets to page 1 when a filter changes while on a later page", async () => {
    fetchMock.mockImplementation(
      withLookupDefaults(() => json({ items: [], total: 0, page: 1, pageSize: 20 })),
    );
    renderAt("admin", "?page=3");
    await waitFor(() => expect(lastListUrl()).toContain("page=3"));

    await userEvent.click(screen.getByRole("button", { name: /more filters/i }));
    await userEvent.click(await screen.findByRole("switch", { name: /open cases only/i }));

    await waitFor(() => expect(lastListUrl()).toContain("open=true"));
    expect(lastListUrl()).toContain("page=1");
  });

  it("shows no Assigned-to filter for a requester", async () => {
    fetchMock.mockImplementation(
      withLookupDefaults(() => json({ items: [], total: 0, page: 1, pageSize: 20 })),
    );
    renderAt("requester");
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByText(/assigned to/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^mine$/i)).not.toBeInTheDocument();
  });

  it("exports without page/pageSize and warns when the backend truncates", async () => {
    fetchMock.mockImplementation(
      withLookupDefaults((url) => {
        if (url.includes("/cases/export")) {
          return new Response("a,b\n1,2", {
            status: 200,
            headers: {
              "Content-Disposition": 'attachment; filename="cases.csv"',
              "X-Export-Truncated": "true",
            },
          });
        }
        return json({ items: [caseRow()], total: 1, page: 1, pageSize: 20 });
      }),
    );
    const { toast } = await import("sonner");
    renderAt("admin", "?status=Submitted");
    await waitFor(() => expect(screen.getByText("Vendor dispute")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /export/i }));

    await waitFor(() => expect(urls().some((u) => u.includes("/cases/export"))).toBe(true));
    const exportUrl = urls().find((u) => u.includes("/cases/export"))!;
    expect(exportUrl).toContain("status=Submitted");
    expect(exportUrl).not.toContain("page=");
    expect(exportUrl).not.toContain("pageSize=");
    await waitFor(() => expect(toast.warning).toHaveBeenCalled());
  });

  it("shows the confidential badge on a confidential case row", async () => {
    fetchMock.mockImplementation(
      withLookupDefaults(() =>
        json({ items: [caseRow({ isConfidential: true })], total: 1, page: 1, pageSize: 20 }),
      ),
    );
    renderAt("admin");
    await waitFor(() => expect(screen.getByText("Confidential")).toBeInTheDocument());
  });

  it("shows an empty state with Clear filters when nothing matches", async () => {
    fetchMock.mockImplementation(
      withLookupDefaults(() => json({ items: [], total: 0, page: 1, pageSize: 20 })),
    );
    renderAt("admin", "?status=Closed");
    expect(await screen.findByText(/no cases match/i)).toBeInTheDocument();
  });
});
