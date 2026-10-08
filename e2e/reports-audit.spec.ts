import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { loginAs, pickDate } from "./fixtures";

test("manager exports a report as CSV (BOM + header row) and sees workflow events in the audit log", async ({
  page,
}) => {
  await loginAs(page, "manager");
  // the filters read "Created to" as the end of that day in local time, so use the local date, not UTC
  const today = new Date().toLocaleDateString("en-CA");

  await page.goto("/reports");
  await pickDate(page, /created from/i, "2020-01-01");
  await pickDate(page, /created to/i, today);
  await expect(page.getByText(/% compliant|no closed cases yet/i)).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /export csv/i }).click(),
  ]);
  const path = await download.path();
  const bytes = readFileSync(path);
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  expect(bytes.toString("utf8").slice(1).split("\n")[0]).toContain("closedOnTime");

  await page.goto("/audit");
  await pickDate(page, /created from/i, "2020-01-01");
  await pickDate(page, /created to/i, today);
  // the seed alone writes user.* and case.* events, so this does not depend on other specs having run
  await expect(page.getByText(/\b(user|case)[._]\w+/).first()).toBeVisible();
});

test("a reversed date range shows an inline error on reports and audit", async ({ page }) => {
  await loginAs(page, "manager");
  for (const path of ["/reports", "/audit"]) {
    await page.goto(path);
    await pickDate(page, /created from/i, "2026-12-31");
    await pickDate(page, /created to/i, "2026-01-01");
    await expect(page.getByText(/must not be after/i)).toBeVisible();
  }
});

test("a date picker can be cleared and then shows its placeholder again", async ({ page }) => {
  await loginAs(page, "manager");
  await page.goto("/audit");
  await pickDate(page, /created from/i, "2026-03-15");
  await expect(page.getByLabel(/created from/i)).toContainText("15 Mar 2026");
  await page.getByLabel(/created from/i).click();
  await page.getByRole("button", { name: /^clear$/i }).click();
  await expect(page.getByLabel(/created from/i)).toContainText(/pick a date/i);
});
