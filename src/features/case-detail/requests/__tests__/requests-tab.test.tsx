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
  documents: unknown[] = [],
) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith("/cases/c1/information-requests")) return json(requests);
    if (url.endsWith("/cases/c1/documents")) return json(documents);
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
  it("lists what was attached to a request, with a download for each file", async () => {
    const doc = {
      id: "doc-1",
      caseId: "c1",
      informationRequestId: "ir-1",
      filename: "signed-contract.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2048,
      category: "Other",
      version: 1,
      rootDocumentId: "doc-1",
      previousVersionId: null,
      uploaderId: "requester-1",
      uploadedByName: "Ria Requester",
      createdAt: "2026-10-09T01:00:00.000Z",
    };
    const other = { ...doc, id: "doc-2", informationRequestId: null, filename: "unrelated.txt" };
    renderTab(
      "legal_rep",
      {},
      [infoRequest({ status: "answered", responseText: "Attached." })],
      "rep-1",
      [doc, other],
    );
    expect(await screen.findByText("signed-contract.pdf")).toBeInTheDocument();
    expect(screen.getByText(/2.0 KB · Ria Requester/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download signed-contract.pdf/i }),
    ).toBeInTheDocument();
    // a case document that belongs to no request is not listed under the request
    expect(screen.queryByText("unrelated.txt")).not.toBeInTheDocument();
  });

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

  it("hides Raise request for a legal_manager who does not hold the case", async () => {
    renderTab("legal_manager", {}, [], "manager-1");
    await screen.findByText(/no information requests/i);
    expect(screen.queryByRole("button", { name: /raise request/i })).not.toBeInTheDocument();
  });

  it("shows Raise request for a legal_manager who holds the case", async () => {
    renderTab("legal_manager", { assignedLegalRepId: "manager-1" }, [], "manager-1");
    expect(await screen.findByRole("button", { name: /raise request/i })).toBeInTheDocument();
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

  it("uploads attachments while the request is still open, then sends the response", async () => {
    const order: string[] = [];
    renderTab("requester", {}, [infoRequest()], "requester-1");
    await userEvent.click(await screen.findByRole("button", { name: /^respond$/i }));
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/information-requests/ir-1/attachments") && init?.method === "POST") {
        order.push("attachment");
        return json({ id: "doc-9" }, 201);
      }
      if (url.endsWith("/information-requests/ir-1/respond")) {
        order.push("respond");
        return json(infoRequest({ status: "answered", responseText: "Here it is" }));
      }
      if (url.endsWith("/cases/c1/documents")) return json([]);
      if (url.endsWith("/cases/c1/information-requests")) return json([infoRequest()]);
      return json({});
    });

    await userEvent.type(screen.getByLabelText(/your response/i), "Here it is");
    await userEvent.upload(
      screen.getByLabelText(/attach files/i),
      new File(["x"], "proof.pdf", { type: "application/pdf" }),
    );
    expect(screen.getByText("proof.pdf")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /send response/i }));

    // the backend only accepts attachments while the request is open, i.e. before the response
    await waitFor(() => expect(order).toEqual(["attachment", "respond"]));
  });

  it("does not send the response when an attachment fails, and keeps the file to retry", async () => {
    const order: string[] = [];
    renderTab("requester", {}, [infoRequest()], "requester-1");
    await userEvent.click(await screen.findByRole("button", { name: /^respond$/i }));
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/attachments") && init?.method === "POST") {
        order.push("attachment");
        return json({ error: { code: "VALIDATION", message: "File type not allowed" } }, 400);
      }
      if (url.endsWith("/respond")) order.push("respond");
      if (url.endsWith("/cases/c1/documents")) return json([]);
      if (url.endsWith("/cases/c1/information-requests")) return json([infoRequest()]);
      return json({});
    });

    await userEvent.type(screen.getByLabelText(/your response/i), "Here it is");
    await userEvent.upload(
      screen.getByLabelText(/attach files/i),
      new File(["x"], "proof.exe", { type: "application/octet-stream" }),
    );
    await userEvent.click(screen.getByRole("button", { name: /send response/i }));

    expect(await screen.findByText(/proof.exe.*File type not allowed/)).toBeInTheDocument();
    expect(order).toEqual(["attachment"]);
    expect(screen.getByText("proof.exe")).toBeInTheDocument();
  });

  it("a backend 400 on respond shows the field message", async () => {
    renderTab("requester", {}, [infoRequest()], "requester-1");
    await userEvent.click(await screen.findByRole("button", { name: /^respond$/i }));

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/respond")) {
        return json({ error: { code: "VALIDATION", message: "Response text is required" } }, 400);
      }
      if (url.endsWith("/cases/c1/documents")) return json([]);
      if (url.endsWith("/cases/c1/information-requests")) return json([infoRequest()]);
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
      if (url.endsWith("/cases/c1/information-request-responders")) {
        return json([
          { id: "requester-1", fullName: "Ria Requester", designation: null, role: "requester" },
        ]);
      }
      if (url.endsWith("/cases/c1/information-requests") && !url.includes("?")) return json([]);
      if (url.includes("/cases/c1/information-requests")) {
        return json(infoRequest(), 201);
      }
      if (url.endsWith("/cases/c1/documents")) return json([]);
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
