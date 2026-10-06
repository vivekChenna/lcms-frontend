import { QueryClient } from "@tanstack/react-query";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile, UserRole } from "@/lib/api/types";
import { setViewport } from "@/test/media";
import { renderWithRouter } from "@/test/router";
import { AppShell } from "../app-shell";

const fetchMock = vi.fn();
const me = (role: UserRole) =>
  ({
    id: "u1",
    fullName: "Vivek Viewer",
    email: "v@x.com",
    designation: "Executive Auditor",
    role,
  }) as Profile;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function setup(role: UserRole = "viewer", path = "/") {
  const queryClient = new QueryClient();
  queryClient.setQueryData(["me"], me(role));
  return {
    ...renderWithRouter(
      <AppShell>
        <p>page body</p>
      </AppShell>,
      { path, queryClient },
    ),
    ue: userEvent.setup(),
  };
}

describe("AppShell", () => {
  it("renders the page inside the shell with the route title", async () => {
    setViewport(1280);
    setup("viewer", "/cases/abc");
    expect(await screen.findByText("page body")).toBeInTheDocument();
    expect(screen.getByTestId("topbar-title")).toHaveTextContent("Cases");
  });

  it("opens the navigation sheet from the hamburger on a phone and closes it on navigate", async () => {
    setViewport(390);
    const { ue, router } = setup("viewer");
    await ue.click(await screen.findByRole("button", { name: /open navigation/i }));
    const sheet = await screen.findByRole("dialog");
    const links = within(sheet)
      .getAllByRole("link")
      .map((a) => a.textContent?.trim());
    expect(links).toEqual(["Dashboard", "Cases", "Reports", "Notifications"]);
    await ue.click(within(sheet).getByRole("link", { name: "Reports" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe("/reports");
  });

  it("collapses the desktop sidebar and remembers it", async () => {
    setViewport(1280);
    const { ue } = setup("admin");
    await ue.click(await screen.findByRole("button", { name: /collapse sidebar/i }));
    expect(window.localStorage.getItem("lcms-sidebar")).toBe("collapsed");
    expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeInTheDocument();
    cleanup();
    setup("admin");
    expect(await screen.findByRole("button", { name: /expand sidebar/i })).toBeInTheDocument();
  });

  it("still renders when localStorage is unavailable", async () => {
    setViewport(1280);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    setup("admin");
    expect(await screen.findByText("page body")).toBeInTheDocument();
  });

  it("has a notification bell linking to /notifications", async () => {
    setViewport(390);
    setup("viewer");
    const bell = await screen.findByRole("link", { name: /open notifications/i });
    expect(bell).toHaveAttribute("href", "/notifications");
  });

  it("user menu shows who is signed in and signs out", async () => {
    setViewport(390);
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { ue, router, queryClient } = setup("viewer");
    await ue.click(await screen.findByRole("button", { name: /account menu/i }));
    const menu = await screen.findByRole("menu");
    expect(menu).toHaveTextContent("Vivek Viewer");
    expect(menu).toHaveTextContent("Executive Auditor");
    expect(menu).toHaveTextContent("Viewer");
    await ue.click(within(menu).getByRole("menuitem", { name: /sign out/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(fetchMock.mock.calls[0]![0]).toMatch(/\/auth\/logout$/);
    expect(queryClient.getQueryData(["me"])).toBeUndefined();
  });

  it("user menu opens the change password dialog", async () => {
    setViewport(1280);
    const { ue } = setup("viewer");
    await ue.click(await screen.findByRole("button", { name: /account menu/i }));
    await ue.click(await screen.findByRole("menuitem", { name: /change password/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/current password/i)).toBeInTheDocument();
  });
});
