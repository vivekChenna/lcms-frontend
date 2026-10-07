import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeProfile } from "@/test/render";
import { NewRequestPage } from "../new-request-page";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

/** `handler` returns a Response for the urls it cares about and `undefined` for everything
 * else, which falls through to these defaults (category/type/department lists used by
 * `fillStep1`; an empty array for entities/business-units/users). */
function withLookupDefaults(handler: (url: string) => Response | Promise<Response> | undefined) {
  return async (url: string) => {
    const custom = await handler(url);
    if (custom !== undefined) return custom;
    if (url.includes("/case-types")) {
      return json([{ id: "type-1", categoryId: "cat-1", name: "Internal Query" }]);
    }
    if (url.includes("/case-categories")) {
      return json([{ id: "cat-1", name: "Internal" }]);
    }
    if (url.includes("/departments")) {
      return json([{ id: "dept-1", name: "Finance" }]);
    }
    return json([]);
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => vi.unstubAllGlobals());

function renderPage(roleOverrides: Partial<ReturnType<typeof makeProfile>> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(["me"], makeProfile(roleOverrides));
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const newRequest = createRoute({
    getParentRoute: () => rootRoute,
    path: "/new-request",
    component: NewRequestPage,
  });
  const caseDetail = createRoute({
    getParentRoute: () => rootRoute,
    path: "/cases/$caseId",
    component: () => <div data-testid="case-detail-page" />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([newRequest, caseDetail]),
    history: createMemoryHistory({ initialEntries: ["/new-request"] }),
  });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
  return { router };
}

const urls = () => fetchMock.mock.calls.map((c) => String(c[0]));

async function fillStep1() {
  // the router needs a tick to settle its initial match before the form is in the DOM
  await userEvent.type(await screen.findByLabelText(/^title$/i), "Vendor dispute");
  await userEvent.type(
    screen.getByLabelText(/description/i),
    "A description that is definitely twenty characters or more.",
  );
  await userEvent.click(screen.getByLabelText(/^category$/i));
  await userEvent.click(await screen.findByRole("option", { name: "Internal" }));
  await userEvent.click(screen.getByLabelText(/case type/i));
  await userEvent.click(await screen.findByRole("option", { name: "Internal Query" }));
  await userEvent.click(screen.getByLabelText(/department/i));
  await userEvent.click(await screen.findByRole("option", { name: "Finance" }));
}

describe("NewRequestPage", () => {
  it("blocks Next on step 1 until the required fields are valid", async () => {
    fetchMock.mockImplementation(withLookupDefaults(() => undefined));
    renderPage({ role: "requester" });
    await userEvent.click(await screen.findByRole("button", { name: /^next$/i }));
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
  });

  it("maps a backend validation error to the right field and returns to step 1", async () => {
    fetchMock.mockImplementation(
      withLookupDefaults((url) => {
        if (url.includes("/cases") && !url.includes("documents")) {
          return json(
            {
              error: {
                code: "VALIDATION",
                message: "Invalid",
                details: { description: "Too short" },
              },
            },
            400,
          );
        }
        return undefined;
      }),
    );
    renderPage({ role: "requester" });
    await fillStep1();
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));
    await userEvent.click(screen.getByLabelText(/confirm the information/i));
    await userEvent.click(screen.getByRole("button", { name: /submit request/i }));

    expect(await screen.findByText("Too short")).toBeInTheDocument();
    expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
  });

  it("submits and navigates to the new case on success", async () => {
    fetchMock.mockImplementation(
      withLookupDefaults((url) => {
        if (url.endsWith("/cases") || (url.includes("/cases") && !url.includes("/documents"))) {
          return json({ id: "c1", referenceNumber: "AGC-INT-000099" }, 201);
        }
        return undefined;
      }),
    );
    const { router } = renderPage({ role: "requester" });
    await fillStep1();
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));
    await userEvent.click(screen.getByLabelText(/confirm the information/i));
    await userEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/cases/c1"));
    // A successful submit must navigate straight away, with no "Leave this page?" prompt (the
    // unsaved-changes blocker's condition has to be false by the time navigate() runs, not
    // racing a mutation flag that updates on the next render).
    expect(window.confirm).not.toHaveBeenCalled();
    const postCall = fetchMock.mock.calls.find(
      (c) => String(c[0]).endsWith("/cases") && (c[1] as RequestInit)?.method === "POST",
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse(String((postCall?.[1] as RequestInit).body));
    expect(body.declarationConfirmed).toBe(true);
    expect(body).not.toHaveProperty("entityId");
  });

  it("includes entityId for an admin submitter", async () => {
    fetchMock.mockImplementation(
      withLookupDefaults((url) => {
        if (url.includes("/entities")) return json([{ id: "e1", name: "AGC" }]);
        if (url.endsWith("/cases") || (url.includes("/cases") && !url.includes("/documents"))) {
          return json({ id: "c1", referenceNumber: "AGC-INT-000099" }, 201);
        }
        return undefined;
      }),
    );
    renderPage({ role: "admin" });
    await fillStep1();
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByLabelText(/^entity$/i)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/^entity$/i));
    await userEvent.click(await screen.findByRole("option", { name: "AGC" }));
    await userEvent.click(screen.getByRole("button", { name: /^next$/i }));
    await userEvent.click(screen.getByLabelText(/confirm the information/i));
    await userEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          (c) => String(c[0]).endsWith("/cases") && (c[1] as RequestInit)?.method === "POST",
        ),
      ).toBe(true),
    );
    const postCall = fetchMock.mock.calls.find(
      (c) => String(c[0]).endsWith("/cases") && (c[1] as RequestInit)?.method === "POST",
    )!;
    const body = JSON.parse(String((postCall[1] as RequestInit).body));
    expect(body.entityId).toBe("e1");
  });
});
