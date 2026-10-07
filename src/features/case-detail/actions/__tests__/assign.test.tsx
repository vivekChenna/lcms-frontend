import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeProfile } from "@/test/render";
import { AssignDialog } from "../assign";

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

function renderIt(open = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(["me"], makeProfile({ role: "legal_manager" }));
  const onOpenChange = vi.fn();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<AssignDialog caseId="c1" open={open} onOpenChange={onOpenChange} />, {
    wrapper: Wrapper,
  });
  return { onOpenChange };
}

describe("AssignDialog", () => {
  it("lists the active legal reps and assigns the chosen one", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (String(url).includes("/users")) {
        return Promise.resolve(
          json({
            items: [
              { id: "r1", fullName: "Rep One" },
              { id: "r2", fullName: "Rep Two" },
            ],
            total: 2,
            page: 1,
            pageSize: 100,
          }),
        );
      }
      return Promise.resolve(json({ id: "c1" }));
    });
    const { onOpenChange } = renderIt();

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByText("Rep Two"));
    await userEvent.click(screen.getByRole("button", { name: /^assign$/i }));

    await waitFor(() =>
      expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("/cases/c1/assign"))).toBe(
        true,
      ),
    );
    const call = fetchMock.mock.calls.find((c) => String(c[0]).includes("/cases/c1/assign"));
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ targetLegalRepId: "r2" });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("disables Assign until a rep is chosen", async () => {
    fetchMock.mockResolvedValue(json({ items: [], total: 0, page: 1, pageSize: 100 }));
    renderIt();
    expect(screen.getByRole("button", { name: /^assign$/i })).toBeDisabled();
  });
});
