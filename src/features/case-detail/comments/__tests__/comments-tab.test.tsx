import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CaseDto, UserRole } from "@/lib/api/types";
import { makeProfile } from "@/test/render";
import { CommentsTab } from "../comments-tab";

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

function commentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "cm-1",
    caseId: "c1",
    authorId: "rep-1",
    authorName: "Rex Rep",
    authorRole: "legal_rep",
    body: "Please review the attached contract.",
    isInternal: false,
    createdAt: "2026-10-09T00:00:00.000Z",
    updatedAt: "2026-10-09T00:00:00.000Z",
    ...overrides,
  };
}

function renderTab(role: UserRole, comments: unknown[] = [], meId = "rep-1") {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith("/cases/c1/comments")) return json(comments);
    return json({});
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <CommentsTab caseItem={makeCase()} me={makeProfile({ role, id: meId })} />
    </QueryClientProvider>,
  );
}

describe("CommentsTab", () => {
  it("shows no internal checkbox for a requester", async () => {
    renderTab("requester", [], "requester-1");
    await screen.findByLabelText(/add a comment/i);
    expect(screen.queryByLabelText(/internal note/i)).not.toBeInTheDocument();
  });

  it("a manager sees the internal checkbox and posting sends isInternal: true", async () => {
    renderTab("legal_manager", [], "manager-1");
    await screen.findByLabelText(/add a comment/i);
    expect(screen.getByLabelText(/internal note/i)).toBeInTheDocument();

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/cases/c1/comments") && init?.method === "POST") {
        return json(commentRow(), 201);
      }
      if (url.endsWith("/cases/c1/comments")) return json([commentRow()]);
      return json({});
    });

    await userEvent.type(screen.getByLabelText(/add a comment/i), "Internal note text");
    await userEvent.click(screen.getByLabelText(/internal note/i));
    await userEvent.click(screen.getByRole("button", { name: /^post$/i }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        (c) =>
          String(c[0]).endsWith("/cases/c1/comments") && (c[1] as RequestInit)?.method === "POST",
      );
      expect(postCall).toBeDefined();
    });
    const postCall = fetchMock.mock.calls.find(
      (c) =>
        String(c[0]).endsWith("/cases/c1/comments") && (c[1] as RequestInit)?.method === "POST",
    )!;
    const body = JSON.parse(String((postCall[1] as RequestInit).body));
    expect(body).toEqual({ body: "Internal note text", isInternal: true });
  });

  it("renders the Internal badge for an internal comment, visible to legal roles", async () => {
    renderTab("legal_manager", [commentRow({ isInternal: true })], "manager-1");
    await screen.findByText("Please review the attached contract.");
    expect(screen.getByText("Internal")).toBeInTheDocument();
  });

  it("shows Edit/Delete only to the comment's own author", async () => {
    renderTab("legal_manager", [commentRow({ authorId: "rep-1" })], "manager-1");
    await screen.findByText("Please review the attached contract.");
    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
  });

  it("shows Edit/Delete to the comment's author", async () => {
    renderTab("legal_rep", [commentRow({ authorId: "rep-1" })], "rep-1");
    await screen.findByText("Please review the attached contract.");
    expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
  });
});
