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
  rep1: ["/", "/cases", "/new-request", "/notifications"],
  requester: ["/", "/cases", "/new-request", "/notifications"],
  viewer: ["/", "/cases", "/reports", "/notifications"],
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
