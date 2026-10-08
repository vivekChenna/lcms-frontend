import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserRole } from "@/lib/api/types";
import { makeProfile } from "@/test/render";
import { UsersPage } from "../users-page";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

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
    isInvited: false,
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

describe("UsersPage password ownership", () => {
  const list = (items: unknown[]) => json({ items, total: items.length, page: 1, pageSize: 20 });
  const listHandler = (items: unknown[]) => (url: string) =>
    url.endsWith("/users") || url.includes("/users?") ? list(items) : undefined;

  beforeEach(() => vi.mocked(toast.success).mockClear());

  it("the New user form has no password field and says the person chooses their own", async () => {
    renderAt("admin", "admin-1", listHandler([userRow()]));
    await screen.findByText("Rex Rep");
    await userEvent.click(screen.getByRole("button", { name: /new user/i }));
    expect(await screen.findByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.getByText(/email with a link to choose their own password/i)).toBeInTheDocument();
  });

  it("sends only the details, never a password, and reports that the invitation went out", async () => {
    renderAt("admin", "admin-1", listHandler([]));
    await screen.findByText(/no users match/i);
    await userEvent.click(screen.getByRole("button", { name: /new user/i }));
    fetchMock.mockImplementation(
      withLookupDefaults((url) =>
        url.endsWith("/users")
          ? json(
              {
                ...userRow({ id: "u9", email: "new@example.com", isInvited: true }),
                inviteEmailSent: true,
              },
              201,
            )
          : undefined,
      ),
    );
    await userEvent.type(screen.getByLabelText(/full name/i), "New Person");
    await userEvent.type(screen.getByLabelText(/^email$/i), "new@example.com");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/invitation sent to new@example.com/i),
      ),
    );
    const post = fetchMock.mock.calls.find(
      ([u, init]) => String(u).endsWith("/users") && init?.method === "POST",
    );
    expect(JSON.parse(post![1].body)).toEqual({ fullName: "New Person", email: "new@example.com" });
  });

  it("warns, and says what to do, when the user was created but the email could not be sent", async () => {
    renderAt("admin", "admin-1", listHandler([]));
    await screen.findByText(/no users match/i);
    await userEvent.click(screen.getByRole("button", { name: /new user/i }));
    fetchMock.mockImplementation(
      withLookupDefaults((url) =>
        url.endsWith("/users")
          ? json({ ...userRow({ id: "u9", isInvited: true }), inviteEmailSent: false }, 201)
          : undefined,
      ),
    );
    await userEvent.type(screen.getByLabelText(/full name/i), "New Person");
    await userEvent.type(screen.getByLabelText(/^email$/i), "new@example.com");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        expect.stringMatching(/could not be sent.*resend invite/i),
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("marks users who have not chosen a password yet as Invited", async () => {
    renderAt("admin", "admin-1", listHandler([userRow({ isInvited: true })]));
    await screen.findByText("Rex Rep");
    expect(screen.getByText("Invited")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("offers Resend invite to an invited user and Send password reset link to an active one", async () => {
    renderAt(
      "admin",
      "admin-1",
      listHandler([
        userRow({ id: "u1", fullName: "Inv Ited", isInvited: true }),
        userRow({ id: "u2", fullName: "Act Ive" }),
      ]),
    );
    await screen.findByText("Inv Ited");
    await userEvent.click(screen.getByRole("button", { name: /actions for inv ited/i }));
    expect(await screen.findByRole("menuitem", { name: /resend invite/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /reset password/i })).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: /actions for act ive/i }));
    expect(
      await screen.findByRole("menuitem", { name: /send password reset link/i }),
    ).toBeInTheDocument();
  });

  it("offers neither to a deactivated user", async () => {
    renderAt("admin", "admin-1", listHandler([userRow({ isActive: false })]));
    await screen.findByText("Rex Rep");
    await userEvent.click(screen.getByRole("button", { name: /actions for rex rep/i }));
    await screen.findByRole("menuitem", { name: /^edit$/i });
    expect(
      screen.queryByRole("menuitem", { name: /resend invite|password reset link/i }),
    ).not.toBeInTheDocument();
  });

  it("asks before sending, then sends the link and says so", async () => {
    renderAt("admin", "admin-1", listHandler([userRow()]));
    await screen.findByText("Rex Rep");
    await userEvent.click(screen.getByRole("button", { name: /actions for rex rep/i }));
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /send password reset link/i }),
    );

    expect(
      within(await screen.findByRole("dialog")).getByText(/rex@example.com/),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("send-password-link"))).toBe(
      false,
    );

    fetchMock.mockImplementation(
      withLookupDefaults((url) =>
        url.includes("send-password-link") ? json({ emailSent: true }) : undefined,
      ),
    );
    await userEvent.click(screen.getByRole("button", { name: /^send link$/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/link sent to rex@example.com/i),
      ),
    );
    const call = fetchMock.mock.calls.find(([u]) => String(u).includes("send-password-link"));
    expect(String(call![0])).toMatch(/\/users\/u1\/send-password-link$/);
    expect(call![1].method).toBe("POST");
  });

  it("shows the server's reason when the email cannot be sent", async () => {
    renderAt("admin", "admin-1", listHandler([userRow()]));
    await screen.findByText("Rex Rep");
    await userEvent.click(screen.getByRole("button", { name: /actions for rex rep/i }));
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /send password reset link/i }),
    );
    fetchMock.mockImplementation(
      withLookupDefaults((url) =>
        url.includes("send-password-link")
          ? json(
              {
                error: {
                  code: "SERVICE_UNAVAILABLE",
                  message: "The email could not be sent. Check the mail settings and try again.",
                },
              },
              503,
            )
          : undefined,
      ),
    );
    await userEvent.click(screen.getByRole("button", { name: /^send link$/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/email could not be sent/i)),
    );
  });
});

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
    for (const name of [
      /^edit$/i,
      /^change role$/i,
      /^send password reset link$/i,
      /^deactivate$/i,
    ]) {
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
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("A user with this email already exists")).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
  });
});
