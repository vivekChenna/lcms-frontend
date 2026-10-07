import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CaseDto, UserRole } from "@/lib/api/types";
import { makeProfile } from "@/test/render";
import { RequestsTab } from "../requests-tab";

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

function makeCase(overrides: Partial<CaseDto> = {}): CaseDto {
  return {
    id: "c1",
    referenceNumber: "AGC-INT-000001",
    title: "Test case",
    description: "A test case.",
    declarationConfirmed: true,
    categoryId: "cat-1",
    caseTypeId: "type-1",
    departmentId: "dept-1",
    entityId: "entity-1",
    businessUnitId: null,
    priority: "P3",
    status: "In Progress",
    isEscalated: false,
    escalationReason: null,
    waitingOnReason: null,
    requesterId: "requester-1",
    assignedLegalRepId: "rep-1",
    assignmentAcceptedAt: "2026-10-01T00:00:00.000Z",
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
    assignedLegalRepName: "Rex Rep",
    assignedLegalRepRole: "legal_rep",
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

function infoRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: "ir-1",
    caseId: "c1",
    subject: "Need the signed contract",
    requirementDescription: "Please upload the fully signed contract.",
    raisedById: "rep-1",
    raisedByName: "Rex Rep",
    raisedByRole: "legal_rep",
    responderId: "requester-1",
    responderName: "Ria Requester",
    dueDate: null,
    status: "open",
    responseText: null,
    reopenedFromId: null,
    createdAt: "2026-10-09T00:00:00.000Z",
    updatedAt: "2026-10-09T00:00:00.000Z",
    ...overrides,
  };
}

function renderTab(
  role: UserRole,
  caseOverrides: Partial<CaseDto> = {},
  requests: unknown[] = [],
  meId = "rep-1",
) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith("/cases/c1/information-requests")) return json(requests);
    return json({});
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <RequestsTab caseItem={makeCase(caseOverrides)} me={makeProfile({ role, id: meId })} />
    </QueryClientProvider>,
  );
}

describe("RequestsTab", () => {
  it("shows Raise request for the assigned legal_rep on an In Progress case", async () => {
    renderTab("legal_rep", {}, []);
    expect(await screen.findByRole("button", { name: /raise request/i })).toBeInTheDocument();
  });

  it("hides Raise request for a requester", async () => {
    renderTab("requester", {}, []);
    await screen.findByText(/no information requests/i);
    expect(screen.queryByRole("button", { name: /raise request/i })).not.toBeInTheDocument();
  });

  it("hides Raise request for a viewer", async () => {
    renderTab("viewer", {}, []);
    await screen.findByText(/no information requests/i);
    expect(screen.queryByRole("button", { name: /raise request/i })).not.toBeInTheDocument();
  });

  it("hides Raise request for a legal_manager", async () => {
    renderTab("legal_manager", {}, [], "manager-1");
    await screen.findByText(/no information requests/i);
    expect(screen.queryByRole("button", { name: /raise request/i })).not.toBeInTheDocument();
  });

  it("hides Raise request for the assigned rep when the case is not In Progress/Waiting on Input", async () => {
    renderTab("legal_rep", { status: "Assigned" }, []);
    await screen.findByText(/no information requests/i);
    expect(screen.queryByRole("button", { name: /raise request/i })).not.toBeInTheDocument();
  });

  it("shows Respond only to the named responder while open", async () => {
    renderTab("requester", {}, [infoRequest()], "requester-1");
    expect(await screen.findByRole("button", { name: /^respond$/i })).toBeInTheDocument();
  });

  it("hides Respond for someone other than the named responder", async () => {
    renderTab("legal_manager", {}, [infoRequest()], "someone-else");
    await screen.findByText("Need the signed contract");
    expect(screen.queryByRole("button", { name: /^respond$/i })).not.toBeInTheDocument();
  });

  it("hides Respond once the request is answered", async () => {
    renderTab(
      "requester",
      {},
      [infoRequest({ status: "answered", responseText: "Done" })],
      "requester-1",
    );
    await screen.findByText("Need the signed contract");
    expect(screen.queryByRole("button", { name: /^respond$/i })).not.toBeInTheDocument();
  });

  it("a backend 400 on respond shows the field message", async () => {
    renderTab("requester", {}, [infoRequest()], "requester-1");
    await userEvent.click(await screen.findByRole("button", { name: /^respond$/i }));

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/respond")) {
        return json({ error: { code: "VALIDATION", message: "Response text is required" } }, 400);
      }
      return json({});
    });

    await userEvent.type(screen.getByLabelText(/your response/i), "a response");
    await userEvent.click(screen.getByRole("button", { name: /send response/i }));

    expect(await screen.findByText("Response text is required")).toBeInTheDocument();
  });

  it("raising a request posts subject/description/responderId and invalidates the key prefixes", async () => {
    renderTab("legal_rep", {}, []);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/cases/c1/information-requests") && !url.includes("?")) return json([]);
      if (url.includes("/cases/c1/information-requests")) {
        return json(infoRequest(), 201);
      }
      return json({});
    });

    cleanup();
    render(
      <QueryClientProvider client={qc}>
        <RequestsTab caseItem={makeCase()} me={makeProfile({ role: "legal_rep", id: "rep-1" })} />
      </QueryClientProvider>,
    );

    await userEvent.click(await screen.findByRole("button", { name: /raise request/i }));
    await userEvent.type(screen.getByLabelText(/subject/i), "Need more info");
    await userEvent.type(screen.getByLabelText(/what do you need/i), "Please clarify the dates");
    const raiseButtons = screen.getAllByRole("button", { name: /^raise request$/i });
    await userEvent.click(raiseButtons[raiseButtons.length - 1]!);

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        (c) =>
          String(c[0]).endsWith("/cases/c1/information-requests") &&
          (c[1] as RequestInit)?.method === "POST",
      );
      expect(postCall).toBeDefined();
    });
    const postCall = fetchMock.mock.calls.find(
      (c) =>
        String(c[0]).endsWith("/cases/c1/information-requests") &&
        (c[1] as RequestInit)?.method === "POST",
    )!;
    const body = JSON.parse(String((postCall[1] as RequestInit).body));
    expect(body).toEqual({
      subject: "Need more info",
      requirementDescription: "Please clarify the dates",
      responderId: "requester-1",
    });

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
    const keys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: unknown[] }).queryKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        ["comments", "c1"],
        ["documents", "c1"],
        ["info-requests", "c1"],
        ["case", "c1"],
        ["cases"],
        ["dashboard"],
      ]),
    );
  });
});
