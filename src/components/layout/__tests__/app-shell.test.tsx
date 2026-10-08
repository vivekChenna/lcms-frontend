import { QueryClient } from "@tanstack/react-query";
import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
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

const notificationsPage = () =>
  new Response(JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, unreadCount: 0 }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  fetchMock.mockReset();
  // The topbar's NotificationBell polls /notifications on mount in every test here; give it a
  // harmless default response so tests unrelated to notifications don't have to know about it.
  fetchMock.mockImplementation(async (url: string) =>
    String(url).includes("/notifications")
      ? notificationsPage()
      : new Response(null, { status: 204 }),
  );
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
    expect(links).toEqual(["Dashboard", "Cases", "Reports", "Rules & SLAs", "Notifications"]);
    await ue.click(within(sheet).getByRole("link", { name: "Reports" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe("/reports");
  });

  it("closes the navigation sheet whenever the path changes", async () => {
    setViewport(390);
    const { ue, router } = setup("viewer");
    await ue.click(await screen.findByRole("button", { name: /open navigation/i }));
    await screen.findByRole("dialog");
    await act(() => router.navigate({ to: "/cases" as never }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  // Headless Chrome reports zero safe-area insets, so the env() padding is pinned by class here.
  it("pads the rail, topbar, main area and nav sheet for notched phones in landscape", async () => {
    setViewport(844);
    const { ue, container } = setup("viewer");
    await screen.findByText("page body");
    const aside = container.querySelector("aside")!;
    expect(aside.className).toContain("pl-[env(safe-area-inset-left)]");
    expect(aside.className).toContain("md:w-[calc(4.5rem+env(safe-area-inset-left))]");
    const main = container.querySelector("main")!;
    expect(main.className).toContain("md:pr-[max(1.5rem,env(safe-area-inset-right))]");
    expect(main.className).toContain("pl-[max(1rem,env(safe-area-inset-left))]");
    const header = container.querySelector("header")!;
    expect(header.className).toContain("pt-[env(safe-area-inset-top)]");
    expect(header.className).toContain("md:pr-[max(1.5rem,env(safe-area-inset-right))]");
    expect(header.className).toContain("pl-[max(0.5rem,env(safe-area-inset-left))]");
    await ue.click(screen.getByRole("button", { name: /open navigation/i }));
    expect((await screen.findByRole("dialog")).className).toContain(
      "pl-[env(safe-area-inset-left)]",
    );
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

  it("animates the collapse: the width ends at the rail, then the labels go icon-only", async () => {
    setViewport(1280);
    const { ue, container } = setup("admin");
    await screen.findByText("page body");
    const aside = container.querySelector("aside")!;
    expect(aside.style.width).toContain("15rem");

    await ue.click(await screen.findByRole("button", { name: /collapse sidebar/i }));
    await waitFor(() => expect(aside.style.width).toContain("4.5rem"));
    const label = within(aside).getByText("Dashboard");
    await waitFor(() => expect(label.classList.contains("lg:sr-only")).toBe(true));

    await ue.click(screen.getByRole("button", { name: /expand sidebar/i }));
    // expanding brings the full look back at once, before the width finishes growing
    expect(within(aside).getByText("Dashboard").classList.contains("lg:sr-only")).toBe(false);
    await waitFor(() => expect(aside.style.width).toContain("15rem"));
  });

  it("still renders when localStorage is unavailable", async () => {
    setViewport(1280);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    setup("admin");
    expect(await screen.findByText("page body")).toBeInTheDocument();
  });

  it("has a notification bell that opens a popover with a link to /notifications", async () => {
    setViewport(390);
    const { ue } = setup("viewer");
    await ue.click(await screen.findByRole("button", { name: /notifications/i }));
    const link = await screen.findByRole("link", { name: /view all/i });
    expect(link).toHaveAttribute("href", "/notifications");
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
    expect(fetchMock.mock.calls.some((c) => String(c[0]).match(/\/auth\/logout$/))).toBe(true);
    expect(queryClient.getQueryData(["me"])).toBeUndefined();
  });

  it("user menu links to the profile page", async () => {
    setViewport(1280);
    const { ue, router } = setup("viewer");
    await ue.click(await screen.findByRole("button", { name: /account menu/i }));
    await ue.click(await screen.findByRole("menuitem", { name: /profile/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile"));
  });
});
