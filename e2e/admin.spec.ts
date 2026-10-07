import { expect, test } from "@playwright/test";
import { PASSWORD, loginAs } from "./fixtures";

test("admin creates a user and a category + case type; deactivating the user signs them out", async ({ browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const email = `e2e-user-${stamp}@example.com`;
  const categoryName = `E2E Category ${stamp}`;
  const caseTypeName = `E2E Type ${stamp}`;

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await loginAs(admin, "admin");

  // create the user
  await admin.goto("/users");
  await admin.getByRole("button", { name: /new user/i }).click();
  await admin.getByLabel(/full name/i).fill("E2E Throwaway");
  await admin.getByLabel(/^email$/i).fill(email);
  await admin.getByLabel(/^password$/i).fill(PASSWORD);
  await admin.getByRole("button", { name: /^save$/i }).click();
  await expect(admin.getByText(email)).toBeVisible();

  // create a category and a case type under it
  await admin.goto("/master-data");
  await admin.getByRole("tab", { name: /case categories/i }).click();
  await admin.getByPlaceholder(/new case category name/i).fill(categoryName);
  await admin.getByRole("button", { name: /^add$/i }).click();
  await expect(admin.getByText(categoryName)).toBeVisible();
  await admin.getByRole("tab", { name: /^case types$/i }).click();
  await admin.locator("#ct-category").click();
  await admin.getByRole("option", { name: categoryName }).click();
  await admin.getByLabel(/^name$/i).fill(caseTypeName);
  await admin.getByRole("button", { name: /add case type/i }).click();
  await expect(admin.getByText(caseTypeName)).toBeVisible();

  // the requester's new-request form lists the new category
  const reqCtx = await browser.newContext();
  const requester = await reqCtx.newPage();
  await loginAs(requester, "requester");
  await requester.goto("/new-request");
  await requester.getByLabel(/^category$/i).click();
  await expect(requester.getByRole("option", { name: categoryName })).toBeVisible();
  await requester.keyboard.press("Escape");

  // the new user signs in, then the admin deactivates them; their next page load goes to login
  const userCtx = await browser.newContext();
  const user = await userCtx.newPage();
  await user.goto("/login");
  await user.getByLabel(/email/i).fill(email);
  await user.getByRole("textbox", { name: /password/i }).fill(PASSWORD);
  await user.getByRole("button", { name: /sign in/i }).click();
  await expect(user).toHaveURL(/\/$/);

  await admin.goto("/users");
  await admin.getByRole("row", { name: new RegExp(email) }).getByRole("button", { name: /^deactivate$/i }).click();
  await admin.getByRole("button", { name: /^deactivate$/i }).last().click();
  await expect(admin.getByRole("row", { name: new RegExp(email) }).getByText("Inactive")).toBeVisible();

  await user.goto("/cases");
  await expect(user).toHaveURL(/\/login/);

  for (const c of [adminCtx, reqCtx, userCtx]) await c.close();
});
