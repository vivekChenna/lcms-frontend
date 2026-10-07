import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditTab } from "../audit-tab";

const fetchMock = vi.fn();
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

function page(pageNum: number, total: number) {
  return {
    items: [
      {
        id: `a-${pageNum}`,
        caseId: "c1",
        caseReference: "AGC-INT-000001",
        actorId: "u1",
        actorName: "Rex Rep",
        actorRole: "legal_rep",
        action: "case.submitted",
        beforeValue: null,
        afterValue: null,
        createdAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    total,
    page: pageNum,
    pageSize: 20,
  };
}

describe("AuditTab", () => {
  it("paginates to the next page", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const page1 = !url.includes("page=2");
      return json(page(page1 ? 1 : 2, 40));
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <AuditTab caseId="c1" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("submitted the case")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /next page/i }));

    await waitFor(() =>
      expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("page=2"))).toBe(true),
    );
  });

  it("shows an empty state with no activity", async () => {
    fetchMock.mockImplementation(async () => json({ items: [], total: 0, page: 1, pageSize: 20 }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <AuditTab caseId="c1" />
      </QueryClientProvider>,
    );
    expect(await screen.findByText(/no activity yet/i)).toBeInTheDocument();
  });
});
