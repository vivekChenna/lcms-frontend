import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CaseDto, UserRole } from "@/lib/api/types";
import { makeProfile } from "@/test/render";
import { CloseCaseDialog } from "../actions/close";
import {
  actionsFor,
  type CaseAction,
  useAcceptCase,
  useAssignCase,
  useChangePriority,
  useCloseCase,
  useEscalateCase,
  useRejectCase,
  useUpdateCase,
} from "../use-case-actions";

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

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { Wrapper, qc, invalidateSpy };
}

const urls = () => fetchMock.mock.calls.map((c) => String(c[0]));
const init = (i: number) => fetchMock.mock.calls[i]?.[1] as RequestInit | undefined;

describe("useAcceptCase", () => {
  it("PATCHes /cases/:id/accept with an empty body and invalidates the case", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1", status: "In Progress" }));
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useAcceptCase("c1"), { wrapper: Wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls()[0]).toContain("/cases/c1/accept");
    expect(init(0)?.method).toBe("PATCH");
    expect(JSON.parse(String(init(0)?.body ?? "{}"))).toEqual({});
    // invalidateCase touches case(id), cases, dashboard, case-audit, notifications
    expect(invalidateSpy).toHaveBeenCalledTimes(5);
  });

  it("surfaces the backend error message on failure", async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: "CONFLICT", message: "Case is not awaiting acceptance" } }, 409),
    );
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useAcceptCase("c1"), { wrapper: Wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Case is not awaiting acceptance");
  });
});

describe("useRejectCase", () => {
  it("PATCHes /cases/:id/reject with the reason", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1", status: "Submitted" }));
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useRejectCase("c1"), { wrapper: Wrapper });

    result.current.mutate("not my department");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls()[0]).toContain("/cases/c1/reject");
    expect(init(0)?.method).toBe("PATCH");
    expect(JSON.parse(String(init(0)?.body))).toEqual({ reason: "not my department" });
    expect(invalidateSpy).toHaveBeenCalledTimes(5);
  });
});

describe("useAssignCase", () => {
  it("PATCHes /cases/:id/assign with the target rep", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1", status: "Assigned" }));
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useAssignCase("c1"), { wrapper: Wrapper });

    result.current.mutate("rep-2");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls()[0]).toContain("/cases/c1/assign");
    expect(init(0)?.method).toBe("PATCH");
    expect(JSON.parse(String(init(0)?.body))).toEqual({ targetLegalRepId: "rep-2" });
    expect(invalidateSpy).toHaveBeenCalledTimes(5);
  });
});

describe("useEscalateCase", () => {
  it("PATCHes /cases/:id/escalate with isEscalated and an optional reason", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1", isEscalated: true }));
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useEscalateCase("c1"), { wrapper: Wrapper });

    result.current.mutate({ isEscalated: true, reason: "SLA at risk" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls()[0]).toContain("/cases/c1/escalate");
    expect(init(0)?.method).toBe("PATCH");
    expect(JSON.parse(String(init(0)?.body))).toEqual({
      isEscalated: true,
      reason: "SLA at risk",
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(5);
  });

  it("clears escalation with isEscalated: false and no reason", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1", isEscalated: false }));
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useEscalateCase("c1"), { wrapper: Wrapper });

    result.current.mutate({ isEscalated: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(JSON.parse(String(init(0)?.body))).toEqual({ isEscalated: false });
  });
});

describe("useCloseCase", () => {
  it("PATCHes /cases/:id/close with the exact body and invalidates the five key prefixes", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1", status: "Closed" }));
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useCloseCase("c1"), { wrapper: Wrapper });

    result.current.mutate({
      confirm: true,
      closureSummary: "Resolved by refund",
      closureOutcomeId: "outcome-1",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls()[0]).toContain("/cases/c1/close");
    expect(init(0)?.method).toBe("PATCH");
    expect(JSON.parse(String(init(0)?.body))).toEqual({
      confirm: true,
      closureSummary: "Resolved by refund",
      closureOutcomeId: "outcome-1",
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(5);
  });

  it("a stubbed 409 (open information requests) leaves the dialog open with the backend message", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/closure-outcomes")) {
        return json([{ id: "outcome-1", name: "Resolved" }]);
      }
      if (url.includes("/close")) {
        return json(
          {
            error: {
              code: "CONFLICT",
              message: "Close the open information request first",
            },
          },
          409,
        );
      }
      return json({});
    });
    const { Wrapper } = wrapper();
    const onOpenChange = vi.fn();
    render(
      <Wrapper>
        <CloseCaseDialog caseId="c1" open onOpenChange={onOpenChange} />
      </Wrapper>,
    );

    await userEvent.click(await screen.findByLabelText(/outcome/i));
    await userEvent.click(await screen.findByRole("option", { name: "Resolved" }));
    await userEvent.type(screen.getByLabelText(/summary/i), "Resolved by refund");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /close case/i }));

    expect(await screen.findByText("Close the open information request first")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});

describe("useChangePriority", () => {
  it("PATCHes /cases/:id/priority with the new priority", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1", priority: "P1" }));
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useChangePriority("c1"), { wrapper: Wrapper });

    result.current.mutate("P1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls()[0]).toContain("/cases/c1/priority");
    expect(JSON.parse(String(init(0)?.body))).toEqual({ priority: "P1" });
    expect(invalidateSpy).toHaveBeenCalledTimes(5);
  });
});

describe("useUpdateCase", () => {
  it("PATCHes /cases/:id with the partial body", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1" }));
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useUpdateCase("c1"), { wrapper: Wrapper });

    result.current.mutate({ title: "Updated title", counterparty: null });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(urls()[0]).toContain("/cases/c1");
    expect(urls()[0]).not.toContain("/cases/c1/");
    expect(init(0)?.method).toBe("PATCH");
    expect(JSON.parse(String(init(0)?.body))).toEqual({
      title: "Updated title",
      counterparty: null,
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(5);
  });
});

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

const STATUSES = ["Submitted", "Assigned", "In Progress", "Waiting on Input", "Closed"] as const;
const ROLES: UserRole[] = ["admin", "legal_manager", "legal_rep", "requester", "viewer"];

// Derived from what the server enforces, independent of the implementation. For each (role,
// status): the actions allowed when `related` is true (legal_rep assigned to this case / requester
// owns this case) and when false. related is ignored for admin/legal_manager/viewer.
// Server rules behind it: accept/reject only the assigned rep while Assigned; escalate and close
// only the assigned rep, a manager or an admin; close only from In Progress; edit only the
// submitter or an admin, and only while Submitted.
const EXPECTED: Record<
  UserRole,
  Record<(typeof STATUSES)[number], { related: CaseAction[]; unrelated: CaseAction[] }>
> = {
  admin: {
    Submitted: {
      related: ["assign", "escalate", "priority", "edit"],
      unrelated: ["assign", "escalate", "priority", "edit"],
    },
    Assigned: {
      related: ["assign", "escalate", "priority"],
      unrelated: ["assign", "escalate", "priority"],
    },
    "In Progress": {
      related: ["assign", "escalate", "close", "priority"],
      unrelated: ["assign", "escalate", "close", "priority"],
    },
    "Waiting on Input": {
      related: ["assign", "escalate", "priority"],
      unrelated: ["assign", "escalate", "priority"],
    },
    Closed: { related: [], unrelated: [] },
  },
  legal_manager: {
    Submitted: {
      related: ["assign", "escalate", "priority"],
      unrelated: ["assign", "escalate", "priority"],
    },
    Assigned: {
      related: ["assign", "escalate", "priority"],
      unrelated: ["assign", "escalate", "priority"],
    },
    "In Progress": {
      related: ["assign", "escalate", "close", "priority"],
      unrelated: ["assign", "escalate", "close", "priority"],
    },
    "Waiting on Input": {
      related: ["assign", "escalate", "priority"],
      unrelated: ["assign", "escalate", "priority"],
    },
    Closed: { related: [], unrelated: [] },
  },
  legal_rep: {
    Submitted: { related: ["escalate"], unrelated: [] },
    Assigned: { related: ["accept", "reject", "escalate"], unrelated: [] },
    "In Progress": { related: ["escalate", "close"], unrelated: [] },
    "Waiting on Input": { related: ["escalate"], unrelated: [] },
    Closed: { related: [], unrelated: [] },
  },
  requester: {
    Submitted: { related: ["edit"], unrelated: [] },
    Assigned: { related: [], unrelated: [] },
    "In Progress": { related: [], unrelated: [] },
    "Waiting on Input": { related: [], unrelated: [] },
    Closed: { related: [], unrelated: [] },
  },
  viewer: {
    Submitted: { related: [], unrelated: [] },
    Assigned: { related: [], unrelated: [] },
    "In Progress": { related: [], unrelated: [] },
    "Waiting on Input": { related: [], unrelated: [] },
    Closed: { related: [], unrelated: [] },
  },
};

describe("actionsFor", () => {
  for (const role of ROLES) {
    for (const status of STATUSES) {
      for (const related of [true, false] as const) {
        const expected = EXPECTED[role][status][related ? "related" : "unrelated"];
        it(`${role} / ${status} / related=${related} -> [${expected.join(", ")}]`, () => {
          const me = makeProfile({ role, id: "me-1" });
          const caseItem = makeCase({
            status,
            assignedLegalRepId: role === "legal_rep" ? (related ? "me-1" : "someone-else") : null,
            requesterId:
              role === "requester" ? (related ? "me-1" : "someone-else") : "someone-else",
          });
          expect(actionsFor(me, caseItem)).toEqual(expected);
        });
      }
    }
  }
});
