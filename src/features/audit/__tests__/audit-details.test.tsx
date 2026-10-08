import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeProfile, renderWithProviders } from "@/test/render";
import { AuditDetails } from "../audit-details";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(async (url: string) => {
    if (url.includes("/users")) {
      return json({
        items: [{ id: "rep-1", fullName: "Vivek Legal Rep" }],
        total: 1,
        page: 1,
        pageSize: 100,
      });
    }
    return json([]);
  });
});
afterEach(() => vi.unstubAllGlobals());

const row = {
  id: "a1",
  createdAt: "2026-10-08T07:55:00.000Z",
  actorName: "Vivek Legal Manager",
  actorRole: "legal_manager",
  action: "case.assigned",
  caseId: "c1",
  caseReference: "AGC-INT-000008",
  beforeValue: { id: "c1", status: "Submitted", assignedLegalRepId: null },
  afterValue: {
    id: "c1",
    status: "Assigned",
    referenceNumber: "AGC-INT-000008",
    assignedLegalRepId: "rep-1",
  },
};

describe("AuditDetails", () => {
  it("says who did what, when, and on which case", async () => {
    renderWithProviders(<AuditDetails row={row as never} summary="assigned the case" />, {
      me: makeProfile({ role: "admin" }),
    });
    expect(await screen.findByText("Vivek Legal Manager")).toBeInTheDocument();
    expect(screen.getByText("assigned the case")).toBeInTheDocument();
    expect(screen.getByText("AGC-INT-000008")).toBeInTheDocument();
    expect(screen.getByText(/08 Oct 2026/)).toBeInTheDocument();
  });

  it("lists each change in words, with names instead of ids", async () => {
    renderWithProviders(<AuditDetails row={row as never} summary="assigned the case" />, {
      me: makeProfile({ role: "admin" }),
    });
    const changes = within(await screen.findByRole("list", { name: /what changed/i }));
    expect(changes.getByText("Status")).toBeInTheDocument();
    expect(changes.getByText("Submitted")).toBeInTheDocument();
    expect(changes.getByText("Assigned")).toBeInTheDocument();
    expect(changes.getByText("Assigned to")).toBeInTheDocument();
    expect(await changes.findByText("Vivek Legal Rep")).toBeInTheDocument();
    expect(changes.queryByText(/rep-1/)).not.toBeInTheDocument();
  });

  it("shows a spinner instead of a half-filled list while the names are still loading", async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes("/users") ? new Promise<Response>(() => {}) : Promise.resolve(json([])),
    );
    renderWithProviders(<AuditDetails row={row as never} summary="assigned the case" />, {
      me: makeProfile({ role: "admin" }),
    });
    expect(await screen.findByRole("status", { name: /loading details/i })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /what changed/i })).not.toBeInTheDocument();
  });

  it("keeps the raw data out of sight until 'Technical details' is opened", async () => {
    renderWithProviders(<AuditDetails row={row as never} summary="assigned the case" />, {
      me: makeProfile({ role: "admin" }),
    });
    const summary = await screen.findByText(/technical details/i);
    const details = summary.closest("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    await userEvent.click(summary);
    expect(details.open).toBe(true);
    expect(within(details).getByText(/"assignedLegalRepId": "rep-1"/)).toBeInTheDocument();
  });

  it("says so when no field details were recorded", async () => {
    renderWithProviders(
      <AuditDetails row={{ ...row, beforeValue: null, afterValue: null } as never} summary="x" />,
      { me: makeProfile({ role: "admin" }) },
    );
    expect(await screen.findByText(/no further details were recorded/i)).toBeInTheDocument();
  });
});
