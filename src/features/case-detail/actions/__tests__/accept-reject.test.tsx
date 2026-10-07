import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AcceptRejectActions } from "../accept-reject";

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

function renderIt() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return render(<AcceptRejectActions caseId="c1" />, { wrapper: Wrapper });
}

describe("AcceptRejectActions", () => {
  it("accepts the case on click", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1" }));
    renderIt();

    await userEvent.click(screen.getByRole("button", { name: /accept/i }));

    await waitFor(() => expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/cases/c1/accept"));
  });

  it("requires at least 3 characters before submitting a rejection", async () => {
    renderIt();

    await userEvent.click(screen.getByRole("button", { name: /reject/i }));
    await userEvent.type(screen.getByLabelText(/reason/i), "hi");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the reject reason once it is long enough", async () => {
    fetchMock.mockResolvedValue(json({ id: "c1" }));
    renderIt();

    await userEvent.click(screen.getByRole("button", { name: /reject/i }));
    await userEvent.type(screen.getByLabelText(/reason/i), "not my department");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/cases/c1/reject"));
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ reason: "not my department" });
  });
});
