import { expect, type Page } from "@playwright/test";
import { mailCount, tokenFromMail, waitForNewMail } from "./mail";

export type Who = "requester" | "manager" | "rep1" | "rep2" | "admin" | "viewer";

export const EMAIL: Record<Who, string> = {
  requester: "vivek@gmail.com",
  manager: "viveklegalmanager@gmail.com",
  rep1: "viveklegalrep@gmail.com",
  rep2: "viveklegalrep2@gmail.com",
  admin: "vivekadmin@gmail.com",
  viewer: "vivekviewer@gmail.com",
};
export const PASSWORD = "Password123!";

/** Nav labels each seeded role should see (the permission matrix in src/lib/permissions.ts). */
export const NAV: Record<Who, string[]> = {
  admin: [
    "Dashboard",
    "Cases",
    "New Request",
    "Reports",
    "Audit",
    "Users",
    "Master Data",
    "Routing Rules",
    "Notifications",
  ],
  manager: ["Dashboard", "Cases", "Reports", "Audit", "Users", "Routing Rules", "Notifications"],
  rep1: ["Dashboard", "Cases", "New Request", "Notifications"],
  rep2: ["Dashboard", "Cases", "New Request", "Notifications"],
  requester: ["Dashboard", "Cases", "New Request", "Notifications"],
  viewer: ["Dashboard", "Cases", "Reports", "Notifications"],
};

/**
 * Signs in through the real login form and waits for the dashboard. The backend deliberately
 * allows only 5 logins per minute per account (plugins/rate-limit.ts), which a suite that signs
 * in as the same role from many tests will hit - so when the form reports that, wait and retry
 * instead of failing.
 */
export async function loginAs(page: Page, who: Who): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt++) {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(EMAIL[who]);
    await page.getByRole("textbox", { name: /password/i }).fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    const throttled = page.getByText(/too many attempts/i);
    const arrived = await Promise.race([
      page.waitForURL(/\/$/, { timeout: 15_000 }).then(() => true),
      throttled.waitFor({ timeout: 15_000 }).then(() => false),
    ]).catch(() => false);
    if (arrived) return;
    await page.waitForTimeout(12_000);
  }
  await expect(page).toHaveURL(/\/$/);
}

/** Chooses a date ("YYYY-MM-DD") in a DatePicker by driving its calendar like a person would. */
export async function pickDate(page: Page, label: RegExp, iso: string): Promise<void> {
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  await page.getByLabel(label).click();
  const calendar = page.getByRole("dialog");
  await calendar.getByRole("combobox", { name: /year/i }).selectOption(String(year));
  await calendar.getByRole("combobox", { name: /month/i }).selectOption(String(month - 1));
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long" });
  await calendar
    .getByRole("button", { name: new RegExp(`${monthName} ${day}(st|nd|rd|th), ${year}`) })
    .click();
}

/**
 * As the signed-in admin, adds a user through the real form (no password: they get an email) and
 * returns the one-time token from that email.
 */
export async function inviteUser(admin: Page, fullName: string, email: string): Promise<string> {
  const before = await mailCount(email);
  await admin.goto("/users");
  await admin.getByRole("button", { name: /new user/i }).click();
  await admin.getByLabel(/full name/i).fill(fullName);
  await admin.getByLabel(/^email$/i).fill(email);
  await admin.getByRole("button", { name: /^save$/i }).click();
  // the row, not the page: the "Invitation sent to ..." toast shows the address too
  await expect(admin.getByRole("row", { name: new RegExp(email) })).toBeVisible();
  return tokenFromMail(await waitForNewMail(email, before));
}

/** Opens an emailed link and chooses a password, ending on the sign-in page with its notice. */
export async function chooseNewPassword(
  page: Page,
  token: string,
  password: string,
): Promise<void> {
  await page.goto(`/set-password?token=${token}`);
  await page.getByLabel(/^new password$/i).fill(password);
  await page.getByLabel(/^confirm password$/i).fill(password);
  await page.getByRole("button", { name: /set password/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("status")).toContainText(/password set/i);
}

/** Signs in through the real form with an arbitrary account; returns once the dashboard shows. */
export async function signInAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole("textbox", { name: /password/i }).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Submits a case as the signed-in requester through the real form; returns its detail URL path. */
export async function submitCase(
  page: Page,
  title: string,
  opts: { confidential?: boolean } = {},
): Promise<string> {
  await page.goto("/new-request");
  if (opts.confidential) await page.locator("#rf-confidential").click();
  await page.getByLabel(/^title$/i).fill(title);
  await page.getByLabel(/description/i).fill(`${title} - end-to-end test case with enough detail.`);
  await page.getByLabel(/^category$/i).click();
  await page.getByRole("option", { name: "Internal", exact: true }).click();
  await page.getByLabel(/case type/i).click();
  await page.getByRole("option").first().click();
  await page.getByLabel(/department/i).click();
  await page.getByRole("option", { name: "Finance" }).click();
  await page.getByRole("button", { name: /^next$/i }).click();
  await page.getByRole("button", { name: /^next$/i }).click();
  await page.getByLabel(/confirm the information/i).click();
  await page.getByRole("button", { name: /submit request/i }).click();
  await page.waitForURL(/\/cases\/[0-9a-f-]+/);
  return new URL(page.url()).pathname;
}
