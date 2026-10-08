import { expect, test } from "@playwright/test";
import { EMAIL, NAV, loginAs, type Who } from "./fixtures";

test("wrong password shows an error and stays on /login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(EMAIL.requester);
  await page.getByRole("textbox", { name: /password/i }).fill("not-the-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

for (const who of Object.keys(NAV) as Who[]) {
  test(`${who} lands on the dashboard and sees exactly its nav items`, async ({ page }) => {
    await loginAs(page, who);
    const nav = page.locator("aside").first();
    for (const label of NAV[who]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    const all = [
      "Dashboard",
      "Cases",
      "New Request",
      "Reports",
      "Audit",
      "Users",
      "Master Data",
      "Routing Rules",
      "Notifications",
    ];
    for (const label of all.filter((l) => !NAV[who].includes(l))) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveCount(0);
    }
  });
}

test("a reload keeps the session; sign out clears it and /cases redirects to login", async ({
  page,
}) => {
  await loginAs(page, "requester");
  await page.reload();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: /account menu/i })).toBeVisible();

  await page.getByRole("button", { name: /account menu/i }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/cases");
  await expect(page).toHaveURL(/\/login\?redirect=/);
});

test("a viewer opening /audit or /new-request is sent to the dashboard", async ({ page }) => {
  await loginAs(page, "viewer");
  await page.goto("/audit");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/new-request");
  await expect(page).toHaveURL(/\/$/);
});

test("cookies are HttpOnly and no token is kept in web storage", async ({ page, context }) => {
  await loginAs(page, "requester");
  const cookies = await context.cookies();
  for (const name of ["lcms_access", "lcms_refresh"]) {
    const c = cookies.find((x) => x.name === name);
    expect(c, `${name} cookie`).toBeDefined();
    expect(c!.httpOnly).toBe(true);
  }
  const storage = await page.evaluate(() =>
    JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }),
  );
  expect(storage).not.toMatch(/eyJ/); // a JWT always starts with eyJ
  expect(storage.toLowerCase()).not.toContain("token");
});

test("an expired access cookie is recovered silently through the refresh cookie", async ({
  page,
  context,
}) => {
  await loginAs(page, "requester");
  // let the dashboard's first requests finish: a refresh aborted by the navigation below would rotate
  // the refresh token server-side without the browser storing it, and the backend's reuse detection
  // would then revoke the session
  await expect(page.getByTestId("dashboard-tiles")).toBeVisible();
  await context.clearCookies({ name: "lcms_access" });
  await page.goto("/cases");
  await expect(page).toHaveURL(/\/cases/);
  await expect(page.getByRole("button", { name: /account menu/i })).toBeVisible();
});
