import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TargetDatesDialog } from "../target-dates";

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

const caseItem = {
  id: "c1",
  ackDueAt: "2026-10-12T10:00:00.000Z",
  resolutionDueAt: "2026-10-20T10:00:00.000Z",
};

function renderIt() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onOpenChange = vi.fn();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<TargetDatesDialog caseItem={caseItem} open onOpenChange={onOpenChange} />, {
    wrapper: Wrapper,
  });
  return { onOpenChange };
}

describe("TargetDatesDialog", () => {
  it("asks for a reason and for a change before anything is sent", async () => {
    renderIt();

    await userEvent.click(screen.getByRole("button", { name: /save dates/i }));

    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/change at least one date/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends only the changed date, with the reason", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1" }));
    const { onOpenChange } = renderIt();

    await userEvent.click(screen.getByLabelText(/resolve by/i));
    await userEvent.click(await screen.findByRole("button", { name: /october 25th, 2026/i }));
    await userEvent.type(screen.getByLabelText(/reason/i), "More time agreed");
    await userEvent.click(screen.getByRole("button", { name: /save dates/i }));

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some((c) => String(c[0]).includes("/cases/c1/target-dates")),
      ).toBe(true),
    );
    const call = fetchMock.mock.calls.find((c) => String(c[0]).includes("/target-dates"));
    const body = JSON.parse(String(call?.[1]?.body));
    expect(body.reason).toBe("More time agreed");
    expect(body.resolutionDueAt).toBeTruthy();
    expect(body).not.toHaveProperty("ackDueAt");
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
