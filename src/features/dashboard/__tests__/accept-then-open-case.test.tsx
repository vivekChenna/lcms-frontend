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
import type { CaseDto } from "@/lib/api/types";
import { makeProfile } from "@/test/render";
import { CaseDetailPage } from "@/features/case-detail/case-detail-page";
import { DashboardPage } from "../dashboard-page";
import { managerDashboard } from "./fixtures";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function makeCase(overrides: Partial<CaseDto> = {}): CaseDto {
  return {
    id: "c-mine",
    referenceNumber: "AGC-INT-000009",
    title: "[Demo] A case assigned to the manager themselves",
    description: "Long enough description to pass validation checks here.",
    declarationConfirmed: true,
    categoryId: "cat-1",
    caseTypeId: "type-1",
    departmentId: "dept-1",
    entityId: "entity-1",
    businessUnitId: null,
    priority: "P3",
    status: "Assigned",
    isEscalated: false,
    escalationReason: null,
    waitingOnReason: null,
    requesterId: "requester-1",
    assignedLegalRepId: "me-1",
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
    assignedLegalRepName: "Mia Manager",
    assignedLegalRepRole: "legal_manager",
    assignedLegalRepDesignation: null,
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

describe("accepting a case from the dashboard panel, then opening it", () => {
  it("shows the case already accepted - no stale Accept/Reject - on a manager's own assigned case", async () => {
    let status: CaseDto["status"] = "Assigned";
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/cases/c-mine/accept")) {
        status = "In Progress";
        return json({ id: "c-mine", status });
      }
      if (url.endsWith("/cases/c-mine")) {
        return json(makeCase({ status }));
      }
      if (url.endsWith("/dashboard")) {
        return json({
          ...managerDashboard(),
          myAssignedCases: [
            {
              id: "c-mine",
              referenceNumber: "AGC-INT-000009",
              title: "[Demo] A case assigned to the manager themselves",
              priority: "P3",
              status,
              resolutionDueAt: "2026-10-12T00:00:00.000Z",
              slaState: "on_track",
              assignedLegalRepName: "Mia Manager",
              assignedLegalRepDesignation: null,
            },
          ],
        });
      }
      if (url.includes("/closure-outcomes")) return json([]);
      return json([]);
    });

    // Matches the real app's QueryClient config (router.tsx): a 30s staleTime, not vitest's
    // zero-by-default, since this bug report was specifically about cache staleness.
    const qc = new QueryClient({
      defaultOptions: { queries: { staleTime: 30_000, retry: false } },
    });
    qc.setQueryData(["me"], makeProfile({ role: "legal_manager", id: "me-1" }));

    const rootRoute = createRootRoute({ component: () => <Outlet /> });
    const home = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: DashboardPage,
    });
    const caseDetail = createRoute({
      getParentRoute: () => rootRoute,
      path: "/cases/$caseId",
      component: CaseDetailPage,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([home, caseDetail]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router as never} />
      </QueryClientProvider>,
    );

    // Accept it right from the "Needs your action" dashboard panel.
    const needsAction = within(await screen.findByRole("region", { name: /needs your action/i }));
    await userEvent.click(needsAction.getByRole("button", { name: /^accept$/i }));
    await waitFor(() => expect(status).toBe("In Progress"));
    // accepting it removes it from "Needs your action" (nothing left to act on); open it from
    // "My assigned cases" instead, which keeps showing it regardless of status
    await waitFor(() =>
      expect(screen.queryByRole("region", { name: /needs your action/i })).not.toBeInTheDocument(),
    );

    // Now open the case - a fresh navigation, not a reload.
    await userEvent.click(screen.getAllByRole("link", { name: /AGC-INT-000009/i })[0]!);

    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("AGC-INT-000009"),
    );
    expect(screen.queryByRole("button", { name: /^accept$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^reject$/i })).not.toBeInTheDocument();
  });
});
