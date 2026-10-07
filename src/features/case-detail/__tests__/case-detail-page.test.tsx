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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { CaseDto, UserRole } from "@/lib/api/types";
import { makeProfile } from "@/test/render";
import { CaseDetailPage } from "../case-detail-page";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/** Lookups the overview tab / edit dialog may call; a per-test handler can override by
 * matching the url first and returning its own Response. */
function withLookupDefaults(handler: (url: string) => Response | undefined) {
  return (url: string) => {
    const custom = handler(url);
    if (custom) return Promise.resolve(custom);
    if (url.includes("/closure-outcomes")) return Promise.resolve(json([]));
    return Promise.resolve(json([]));
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function makeCase(overrides: Partial<CaseDto> = {}): CaseDto {
  return {
    id: "c1",
    referenceNumber: "AGC-INT-000001",
    title: "Test case",
    description: "A test case long enough to pass validation.",
    declarationConfirmed: true,
    categoryId: "cat-1",
    caseTypeId: "type-1",
    departmentId: "dept-1",
    entityId: "entity-1",
    businessUnitId: null,
    priority: "P3",
    status: "Submitted",
    isEscalated: false,
    escalationReason: null,
    waitingOnReason: null,
    requesterId: "requester-1",
    assignedLegalRepId: null,
    assignmentAcceptedAt: null,
    ackDueAt: "2026-10-10T00:00:00.000Z",
    resolutionDueAt: "2026-10-12T00:00:00.000Z",
    closureSummary: null,
    closureOutcomeId: null,
    closedById: null,
    closedAt: null,
    isConfidential: false,
    contactName: null,
    contactEmail: null,
    contactPhone: null,
    desiredOutcome: null,
    incidentDate: null,
    businessDeadline: null,
    counterparty: null,
    estimatedValue: null,
    thirdPartyDetails: null,
    requesterName: "Ria Requester",
    requesterDesignation: null,
    assignedLegalRepName: null,
    assignedLegalRepRole: null,
    categoryName: "Internal",
    caseTypeName: "Query",
    departmentName: "Finance",
    entityName: "AGC",
    businessUnitName: null,
    slaState: "on_track",
    caseAgeHours: 1,
    createdAt: "2026-10-09T00:00:00.000Z",
    updatedAt: "2026-10-09T00:00:00.000Z",
    ...overrides,
  };
}

function renderAt(
  role: UserRole,
  handler: (url: string) => Response | undefined = () => undefined,
) {
  fetchMock.mockImplementation(withLookupDefaults(handler));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(["me"], makeProfile({ role, id: "me-1" }));
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const caseDetail = createRoute({
    getParentRoute: () => rootRoute,
    path: "/cases/$caseId",
    validateSearch: z.object({
      tab: z.enum(["overview", "documents", "requests", "comments", "audit"]).catch("overview"),
    }),
    component: CaseDetailPage,
  });
  const casesIndex = createRoute({
    getParentRoute: () => rootRoute,
    path: "/cases",
    component: () => <div data-testid="cases-page" />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([caseDetail, casesIndex]),
    history: createMemoryHistory({ initialEntries: ["/cases/c1"] }),
  });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
  return { router };
}

const ACTION_NAMES = [
  /^accept$/i,
  /^reject$/i,
  /^assign$/i,
  /^reassign$/i,
  /^escalate$/i,
  /^clear escalation$/i,
  /^change priority$/i,
  /^edit$/i,
  /^close case$/i,
];

async function queryVisibleActions() {
  const found: string[] = [];
  for (const re of ACTION_NAMES) {
    const matches = await screen.queryAllByRole("button", { name: re });
    if (matches.length > 0) found.push(re.source);
  }
  return found;
}

describe("CaseDetailPage", () => {
  it("a viewer sees no action buttons", async () => {
    renderAt("viewer", (url) =>
      url.includes("/cases/c1") && !url.includes("/documents")
        ? json(makeCase({ status: "In Progress" }))
        : undefined,
    );
    expect(await screen.findByText("Test case")).toBeInTheDocument();
    expect(await queryVisibleActions()).toEqual([]);
  });

  it("a requester sees Edit only on their own non-closed case", async () => {
    renderAt("requester", (url) =>
      url.endsWith("/cases/c1")
        ? json(makeCase({ status: "Submitted", requesterId: "me-1" }))
        : undefined,
    );
    expect(await screen.findByRole("button", { name: /^edit$/i })).toBeInTheDocument();
    expect(await queryVisibleActions()).toEqual(["^edit$"]);
  });

  it("a requester sees no actions on a case that is not their own", async () => {
    renderAt("requester", (url) =>
      url.endsWith("/cases/c1")
        ? json(makeCase({ status: "Submitted", requesterId: "someone-else" }))
        : undefined,
    );
    await screen.findByText("Test case");
    expect(await queryVisibleActions()).toEqual([]);
  });

  it("a requester sees no Edit on their own closed case", async () => {
    renderAt("requester", (url) =>
      url.endsWith("/cases/c1")
        ? json(makeCase({ status: "Closed", requesterId: "me-1" }))
        : undefined,
    );
    await screen.findByText("Test case");
    expect(await queryVisibleActions()).toEqual([]);
  });

  it("renders 'Case not found' on a 404", async () => {
    renderAt("admin", (url) =>
      url.endsWith("/cases/c1")
        ? json({ error: { code: "NOT_FOUND", message: "Case not found" } }, 404)
        : undefined,
    );
    expect(await screen.findByText("Case not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to the case repository/i })).toBeInTheDocument();
  });

  it("renders a forbidden message on a 403", async () => {
    renderAt("requester", (url) =>
      url.endsWith("/cases/c1")
        ? json({ error: { code: "FORBIDDEN", message: "Not allowed" } }, 403)
        : undefined,
    );
    expect(await screen.findByText("You don't have access")).toBeInTheDocument();
  });

  it("an admin sees the full set of actions on an open case", async () => {
    renderAt("admin", (url) =>
      url.endsWith("/cases/c1") ? json(makeCase({ status: "Submitted" })) : undefined,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^assign$/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /^escalate$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^change priority$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^close case$/i })).toBeInTheDocument();
  });
});
