import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MasterDataPage } from "../master-data-page";

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

function renderPage(handler: (url: string) => Response | undefined = () => undefined) {
  fetchMock.mockImplementation(async (url: string) => {
    const custom = handler(url);
    if (custom) return custom;
    return json([]);
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MasterDataPage />
    </QueryClientProvider>,
  );
  return qc;
}

describe("MasterDataPage", () => {
  it("creating a department sends the name and invalidates the departments lookup", async () => {
    const qc = renderPage((url) => {
      if (url.endsWith("/departments") || url.includes("/departments?")) {
        return json([{ id: "d1", name: "Finance", isActive: true }]);
      }
      return undefined;
    });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    await screen.findByText("Finance");

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/departments") && init?.method === "POST") {
        return json({ id: "d2", name: "Legal", isActive: true }, 201);
      }
      if (url.endsWith("/departments"))
        return json([{ id: "d1", name: "Finance", isActive: true }]);
      return json([]);
    });

    await userEvent.type(screen.getByPlaceholderText(/new department name/i), "Legal");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
    const keys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: unknown[] }).queryKey);
    expect(keys).toEqual(expect.arrayContaining([["lookups", "departments"]]));
  });

  it("a 409 duplicate name shows an inline error", async () => {
    renderPage((url) => {
      if (url.endsWith("/departments") || url.includes("/departments?")) return json([]);
      return undefined;
    });
    await screen.findByText(/no departments yet/i);

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/departments") && init?.method === "POST") {
        return json({ error: { code: "CONFLICT", message: "'Finance' already exists" } }, 409);
      }
      return json([]);
    });

    await userEvent.type(screen.getByPlaceholderText(/new department name/i), "Finance");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(await screen.findByText("'Finance' already exists")).toBeInTheDocument();
  });
});
