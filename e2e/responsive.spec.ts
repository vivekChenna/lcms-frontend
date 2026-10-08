import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { loginAs, type Who } from "./fixtures";

const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 360, height: 740 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 844, height: 390 }, // phone landscape
];
const SHOT_WIDTHS = new Set([375, 820, 1440]);

const ROUTES: Record<Exclude<Who, "rep2">, string[]> = {
  admin: [
    "/",
    "/cases",
    "/new-request",
    "/reports",
    "/audit",
    "/users",
    "/master-data",
    "/rules",
    "/notifications",
  ],
  manager: ["/", "/cases", "/reports", "/audit", "/users", "/rules", "/notifications"],
  rep1: ["/", "/cases", "/new-request", "/rules", "/notifications"],
  requester: ["/", "/cases", "/new-request", "/rules", "/notifications"],
  viewer: ["/", "/cases", "/reports", "/rules", "/notifications"],
};

/** Page must fit the viewport horizontally, render a main region, and show no crash screen. */
async function assertResponsive(page: Page, label: string): Promise<void> {
  // not "networkidle": the app polls notifications, so the network never goes idle
  await expect(page.locator("main").first(), label).toBeVisible();
  await expect(page.locator('[aria-busy="true"], [data-slot="skeleton"]'), label).toHaveCount(0);
  await expect(page.getByText(/something went wrong/i), label).toHaveCount(0);
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(
    overflow.scroll,
    `${label}: horizontal overflow (${overflow.scroll} > ${overflow.inner})`,
  ).toBeLessThanOrEqual(overflow.inner);
}

/**
 * Layout rules that depend on the width: no data tables on phones (cards instead), the navigation
 * pattern for the width (hamburger below lg, rail at md, full sidebar from lg), the page heading
 * inside the viewport, and 44px touch targets below md.
 */
async function assertLayoutRules(page: Page, label: string, width: number): Promise<void> {
  const r = await page.evaluate((w) => {
    const visible = (el: Element) => {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return (
        b.width >= 2 &&
        b.height >= 2 &&
        cs.visibility !== "hidden" &&
        cs.display !== "none" &&
        !el.closest(".sr-only")
      );
    };
    // record tables must be cards on phones; a chart's small data table (the text alternative to the
    // chart, marked data-chart-table) stays as a table and only has to fit the width
    const tables = [...document.querySelectorAll("table:not([data-chart-table])")].filter(
      visible,
    ).length;
    const aside = document.querySelector("aside");
    const asideWidth = aside && visible(aside) ? aside.getBoundingClientRect().width : 0;
    const burger = [...document.querySelectorAll("button")].some(
      (b) => b.getAttribute("aria-label") === "Open navigation" && visible(b),
    );
    const h1 = document.querySelector("main h1");
    const h1Box = h1 && visible(h1) ? h1.getBoundingClientRect() : null;
    const short: string[] = [];
    if (w < 768) {
      const SELECTOR =
        'button, a[href], [role="button"], [role="tab"], [role="combobox"], [role="menuitem"], [role="checkbox"], [role="switch"], input:not([type="hidden"]), select, textarea';
      for (const el of document.querySelectorAll(SELECTOR)) {
        if (!visible(el)) continue;
        if (el.getAttribute("aria-hidden") === "true") continue; // e.g. a switch's hidden form input
        if (el.tagName === "A" && el.closest("p")) continue; // dense inline text links
        const role = el.getAttribute("role");
        if (role === "switch" || role === "checkbox") {
          // elementFromPoint only sees what is on screen, so bring the control into view first
          el.scrollIntoView({ block: "center" });
        }
        const b = el.getBoundingClientRect();
        const name = (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30);
        if (role === "switch" || role === "checkbox") {
          // the visible control is small on purpose; an invisible overlay extends its tap area
          const cx = b.left + b.width / 2;
          const cy = b.top + b.height / 2;
          const reaches = [-21, 21].every((dy) => {
            const hit = document.elementFromPoint(cx, cy + dy);
            return hit === el || el.contains(hit);
          });
          if (!reaches) short.push(`${role} "${name}" tap area under 44px`);
          continue;
        }
        if (b.height < 43.5)
          short.push(`${el.tagName.toLowerCase()} "${name}" ${Math.round(b.height)}px`);
      }
    }
    return { tables, asideWidth, burger, h1Box, inner: window.innerWidth, short };
  }, width);

  if (width < 768) {
    expect(r.tables, `${label}: data tables must be cards below 768px`).toBe(0);
    expect(r.asideWidth, `${label}: the sidebar must be hidden below 768px`).toBe(0);
    expect(r.burger, `${label}: the hamburger must be visible below 768px`).toBe(true);
  } else if (width < 1024) {
    expect(r.asideWidth, `${label}: the sidebar is a rail at this width`).toBeLessThanOrEqual(80);
    expect(r.burger, `${label}: the hamburger must be visible below 1024px`).toBe(true);
  } else {
    expect(r.burger, `${label}: no hamburger from 1024px`).toBe(false);
    expect(r.asideWidth, `${label}: the sidebar is visible from 1024px`).toBeGreaterThan(0);
  }
  if (r.h1Box) {
    expect(r.h1Box.left, `${label}: heading clipped on the left`).toBeGreaterThanOrEqual(0);
    expect(r.h1Box.right, `${label}: heading clipped on the right`).toBeLessThanOrEqual(r.inner);
  }
  expect(r.short, `${label}: controls under 44px: ${r.short.join("; ")}`).toEqual([]);
}

for (const who of Object.keys(ROUTES) as (keyof typeof ROUTES)[]) {
  test(`${who}: every reachable page fits every viewport`, async ({ page }, testInfo) => {
    test.setTimeout(600_000);
    const native = testInfo.project.name === "responsive-mobile-chrome";
    const viewports = native ? [null] : VIEWPORTS;
    mkdirSync("e2e/screenshots", { recursive: true });
    await loginAs(page, who);

    await page.goto("/cases");
    // rows are click targets, not links: a <tr> labelled "Open case AGC-..." in the table layout, a
    // button named by its content ("AGC-... - title ...") in the mobile card layout
    const ref = /AGC-[A-Z]+-\d+/;
    const firstRow = page
      .getByRole("row", { name: ref })
      .or(page.getByRole("button", { name: ref }))
      .locator("visible=true")
      .first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();
    await page.waitForURL(/\/cases\/[0-9a-f-]+/);
    const detail = new URL(page.url()).pathname;
    const routes = detail ? [...ROUTES[who], detail] : ROUTES[who];

    for (const vp of viewports) {
      if (vp) await page.setViewportSize(vp);
      const width = vp?.width ?? page.viewportSize()?.width ?? 0;
      for (const route of routes) {
        await page.goto(route);
        const label = `${who} ${route} @${vp ? `${vp.width}x${vp.height}` : "native"}`;
        await assertResponsive(page, label);
        await assertLayoutRules(page, label, width);
        if (native || SHOT_WIDTHS.has(width)) {
          const slug =
            route === "/"
              ? "dashboard"
              : route.replace(/^\/|\/.*$/g, "") + (route.startsWith("/cases/") ? "-detail" : "");
          await page.screenshot({
            path: `e2e/screenshots/${who}-${slug}-${width}.png`,
            fullPage: true,
          });
        }
      }
    }
  });
}
