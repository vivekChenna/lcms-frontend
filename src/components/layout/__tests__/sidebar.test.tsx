import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { UserRole } from "@/lib/api/types";
import { renderWithRouter } from "@/test/router";
import { Sidebar } from "../sidebar";

afterEach(cleanup);

const ALL = [
  "Dashboard",
  "Cases",
  "New Request",
  "Reports",
  "Audit",
  "Users",
  "Master Data",
  "Rules & SLAs",
  "Notifications",
];

const expected: Record<UserRole, string[]> = {
  admin: ALL,
  legal_manager: [
    "Dashboard",
    "Cases",
    "Reports",
    "Audit",
    "Users",
    "Rules & SLAs",
    "Notifications",
  ],
  legal_rep: ["Dashboard", "Cases", "New Request", "Rules & SLAs", "Notifications"],
  requester: ["Dashboard", "Cases", "New Request", "Rules & SLAs", "Notifications"],
  viewer: ["Dashboard", "Cases", "Reports", "Rules & SLAs", "Notifications"],
};

async function navLabels() {
  const nav = await screen.findByRole("navigation", { name: /main navigation/i });
  return within(nav)
    .getAllByRole("link")
    .map((a) => a.textContent?.trim());
}

describe("Sidebar", () => {
  it.each(Object.entries(expected))("%s sees exactly its nav items", async (role, labels) => {
    renderWithRouter(<Sidebar role={role as UserRole} />);
    expect(await navLabels()).toEqual(labels);
  });

  it("viewer sees Dashboard, Cases, Reports, Rules & SLAs, Notifications only", async () => {
    renderWithRouter(<Sidebar role="viewer" />);
    expect(await navLabels()).toEqual([
      "Dashboard",
      "Cases",
      "Reports",
      "Rules & SLAs",
      "Notifications",
    ]);
  });

  it("links point at the routes", async () => {
    renderWithRouter(<Sidebar role="admin" />);
    const nav = await screen.findByRole("navigation", { name: /main navigation/i });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([
      "/dashboard",
      "/cases",
      "/new-request",
      "/reports",
      "/audit",
      "/users",
      "/master-data",
      "/rules",
      "/notifications",
    ]);
  });

  it("marks the active route, and a case detail keeps Cases active", async () => {
    renderWithRouter(<Sidebar role="admin" />, { path: "/cases/abc" });
    const cases = await screen.findByRole("link", { name: "Cases" });
    expect(cases).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("keeps the labels as accessible names when collapsed to a rail", async () => {
    renderWithRouter(<Sidebar role="viewer" collapsed />);
    expect(await navLabels()).toEqual([
      "Dashboard",
      "Cases",
      "Reports",
      "Rules & SLAs",
      "Notifications",
    ]);
  });

  it("draws the menu as placeholders, with no links, while the session is still loading", async () => {
    renderWithRouter(<Sidebar />);
    expect(await screen.findAllByTestId("nav-skeleton")).toHaveLength(7);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByRole("navigation", { name: /main navigation/i })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});
