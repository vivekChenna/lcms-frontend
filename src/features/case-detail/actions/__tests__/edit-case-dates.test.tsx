import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CaseDto } from "@/lib/api/types";
import { EditCaseDialog } from "../edit-case";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) => {
    if (url.includes("/case-types"))
      return json([{ id: "t1", categoryId: "c1", name: "Query", isActive: true }]);
    if (url.includes("/case-categories"))
      return json([{ id: "c1", name: "Internal", isActive: true }]);
    if (url.includes("/departments")) return json([{ id: "d1", name: "Finance", isActive: true }]);
    return json({});
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const caseWith = (dates: { incidentDate: string | null; businessDeadline: string | null }) =>
  ({
    id: "case-1",
    title: "Vendor dispute",
    description: "A description that is definitely twenty characters or more.",
    categoryId: "c1",
    caseTypeId: "t1",
    departmentId: "d1",
    isConfidential: false,
    contactName: null,
    contactEmail: null,
    contactPhone: null,
    counterparty: null,
    estimatedValue: null,
    desiredOutcome: null,
    thirdPartyDetails: null,
    ...dates,
  }) as unknown as CaseDto;

function renderIt(item: CaseDto) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<EditCaseDialog caseItem={item} open onOpenChange={vi.fn()} />, { wrapper: Wrapper });
}

const patches = () =>
  fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === "PATCH");

describe("EditCaseDialog date rules", () => {
  it("will not save a case that has no incident date or business deadline", async () => {
    renderIt(caseWith({ incidentDate: null, businessDeadline: null }));
    await userEvent.click(await screen.findByRole("button", { name: /^save$/i }));
    expect(await screen.findByText(/incident date is required/i)).toBeInTheDocument();
    expect(screen.getByText(/business deadline is required/i)).toBeInTheDocument();
    expect(patches()).toHaveLength(0);
  });

  it("will not save a deadline that is not after the incident date", async () => {
    renderIt(caseWith({ incidentDate: "2026-05-10", businessDeadline: "2026-05-01" }));
    await userEvent.click(await screen.findByRole("button", { name: /^save$/i }));
    expect(
      await screen.findByText(/deadline must be after the incident date/i),
    ).toBeInTheDocument();
    expect(patches()).toHaveLength(0);
  });

  it("will not save an incident date in the future", async () => {
    renderIt(caseWith({ incidentDate: "2099-01-01", businessDeadline: "2099-02-01" }));
    await userEvent.click(await screen.findByRole("button", { name: /^save$/i }));
    expect(await screen.findByText(/incident date cannot be in the future/i)).toBeInTheDocument();
    expect(patches()).toHaveLength(0);
  });
});
