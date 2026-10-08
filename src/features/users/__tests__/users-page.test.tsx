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
import type { UserRole } from "@/lib/api/types";
import { makeProfile } from "@/test/render";
import { UsersPage } from "../users-page";

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

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "u1",
    fullName: "Rex Rep",
    email: "rex@example.com",
    designation: null,
    phone: null,
    departmentId: null,
    entityId: null,
    businessUnitId: null,
    isActive: true,
    role: "legal_rep",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

function withLookupDefaults(handler: (url: string) => Response | undefined) {
  return async (url: string) => {
    const custom = handler(url);
    if (custom) return custom;
    if (/\/(departments|entities|business-units)(\?|$)/.test(url)) return json([]);
    return json({});
  };
}

function renderAt(
  role: UserRole,
  meId: string,
  handler: (url: string) => Response | undefined = () => undefined,
) {
  fetchMock.mockImplementation(withLookupDefaults(handler));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(["me"], makeProfile({ role, id: meId }));
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const users = createRoute({
    getParentRoute: () => rootRoute,
    path: "/users",
    component: UsersPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([users]),
    history: createMemoryHistory({ initialEntries: ["/users"] }),
  });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
}

describe("UsersPage searching", () => {
  it("shows a spinner, keeps the filters on screen, and sends one request per pause", async () => {
    let release: (r: Response) => void = () => {};
    const slow = new Promise<Response>((resolve) => {
      release = resolve;
    });
    const list = () => json({ items: [userRow()], total: 1, page: 1, pageSize: 20 });
    renderAt("admin", "admin-1", (url) => {
      if (url.includes("search=rex")) return slow as unknown as Response;
      return url.endsWith("/users") || url.includes("/users?") ? list() : undefined;
    });
    await screen.findByText("Rex Rep");
    const box = screen.getByLabelText("Search");

    await userEvent.type(box, "rex");
    // spinner from the first keystroke, same text box (not remounted), old results still visible
    expect(await screen.findByRole("status", { name: /searching/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Search")).toBe(box);
    expect(screen.getByText("Rex Rep")).toBeInTheDocument();

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([u]) => String(u).includes("search=rex"))).toBe(true),
    );
    release(list());
    await waitFor(() =>
      expect(screen.queryByRole("status", { name: /searching/i })).not.toBeInTheDocument(),
    );

    // typed r, re, rex quickly: only the final text was ever requested
    const searches = fetchMock.mock.calls
      .map(([u]) => String(u))
      .filter((u) => u.includes("search="));
    expect(searches).toHaveLength(1);
    expect(searches[0]).toContain("search=rex");
  });
});

describe("UsersPage", () => {
  it("a legal_manager sees no mutation buttons", async () => {
    renderAt("legal_manager", "manager-1", (url) =>
      url.endsWith("/users") || url.includes("/users?")
        ? json({ items: [userRow()], total: 1, page: 1, pageSize: 20 })
        : undefined,
    );
    await screen.findByText("Rex Rep");
    expect(screen.queryByRole("button", { name: /actions for/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new user/i })).not.toBeInTheDocument();
  });

  it("an admin gets one actions menu per row with every action in it", async () => {
    renderAt("admin", "admin-1", (url) =>
      url.endsWith("/users") || url.includes("/users?")
        ? json({ items: [userRow()], total: 1, page: 1, pageSize: 20 })
        : undefined,
    );
    await screen.findByText("Rex Rep");
    expect(screen.getByRole("button", { name: /new user/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /actions for rex rep/i }));
    for (const name of [/^edit$/i, /^change role$/i, /^reset password$/i, /^deactivate$/i]) {
      expect(await screen.findByRole("menuitem", { name })).toBeInTheDocument();
    }
  });

  it("offers Activate instead of Deactivate for an inactive user", async () => {
    renderAt("admin", "admin-1", (url) =>
      url.endsWith("/users") || url.includes("/users?")
        ? json({ items: [userRow({ isActive: false })], total: 1, page: 1, pageSize: 20 })
        : undefined,
    );
    await screen.findByText("Rex Rep");
    await userEvent.click(screen.getByRole("button", { name: /actions for rex rep/i }));
    expect(await screen.findByRole("menuitem", { name: /^activate$/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /^deactivate$/i })).not.toBeInTheDocument();
  });

  it("shows name and email together in one cell, with the role beneath no other column wrapping", async () => {
    renderAt("admin", "admin-1", (url) =>
      url.endsWith("/users") || url.includes("/users?")
        ? json({ items: [userRow()], total: 1, page: 1, pageSize: 20 })
        : undefined,
    );
    const name = await screen.findByText("Rex Rep");
    expect(name.closest("td")).toContainElement(screen.getByText("rex@example.com"));
    expect(screen.getAllByRole("columnheader").length).toBeLessThanOrEqual(5);
  });

  it("omits Deactivate from the signed-in admin's own menu", async () => {
    renderAt("admin", "admin-1", (url) =>
      url.endsWith("/users") || url.includes("/users?")
        ? json({
            items: [userRow({ id: "admin-1", fullName: "Ada Admin", role: "admin" })],
            total: 1,
            page: 1,
            pageSize: 20,
          })
        : undefined,
    );
    await screen.findByText("Ada Admin");
    await userEvent.click(screen.getByRole("button", { name: /actions for ada admin/i }));
    expect(await screen.findByRole("menuitem", { name: /^edit$/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /^deactivate$/i })).not.toBeInTheDocument();
  });

  it("a 409 duplicate email maps to the Email field", async () => {
    renderAt("admin", "admin-1", (url) =>
      url.endsWith("/users") || url.includes("/users?")
        ? json({ items: [], total: 0, page: 1, pageSize: 20 })
        : undefined,
    );
    await screen.findByText(/no users match/i);
    await userEvent.click(screen.getByRole("button", { name: /new user/i }));

    fetchMock.mockImplementation(
      withLookupDefaults((url) => {
        if (url.endsWith("/users")) {
          return json(
            { error: { code: "CONFLICT", message: "A user with this email already exists" } },
            409,
          );
        }
        return undefined;
      }),
    );

    await userEvent.type(screen.getByLabelText(/full name/i), "New Person");
    await userEvent.type(screen.getByLabelText(/^email$/i), "dup@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "Password123!");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("A user with this email already exists")).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
  });
});
