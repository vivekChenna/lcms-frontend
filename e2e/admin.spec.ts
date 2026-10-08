import { expect, test } from "@playwright/test";
import { chooseNewPassword, inviteUser, loginAs, signInAs } from "./fixtures";

test("admin invites a user, who sets their own password; admin also adds a category + case type; deactivating the user signs them out", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const email = `e2e-user-${stamp}@example.com`;
  const fullName = `E2E Throwaway ${stamp}`;
  const categoryName = `E2E Category ${stamp}`;
  const caseTypeName = `E2E Type ${stamp}`;
  const MY_PASSWORD = "My-Own#Passw0rd";

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await loginAs(admin, "admin");

  // invite the user: the form has no password, the row says Invited, and an email carries the link
  await admin.goto("/users");
  await admin.getByRole("button", { name: /new user/i }).click();
  await expect(admin.getByLabel(/password/i)).toHaveCount(0);
  await admin.getByRole("button", { name: /close/i }).first().click();
  const token = await inviteUser(admin, fullName, email);
  await expect(
    admin.getByRole("row", { name: new RegExp(email) }).getByText("Invited"),
  ).toBeVisible();

  // until they choose a password they cannot sign in
  const userCtx = await browser.newContext();
  const user = await userCtx.newPage();
  await user.goto("/login");
  await user.getByLabel(/email/i).fill(email);
  await user.getByRole("textbox", { name: /password/i }).fill("Password123!");
  await user.getByRole("button", { name: /sign in/i }).click();
  await expect(user.getByRole("alert")).toContainText(/invalid email or password/i);

  // they open the link, choose a password, and sign in with it
  await chooseNewPassword(user, token, MY_PASSWORD);
  await signInAs(user, email, MY_PASSWORD);
  await admin.reload();
  await expect(
    admin.getByRole("row", { name: new RegExp(email) }).getByText("Active"),
  ).toBeVisible();

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

  // the admin deactivates the user; their next page load goes to login
  await admin.goto("/users");
  await admin.getByRole("button", { name: `Actions for ${fullName}` }).click();
  await admin.getByRole("menuitem", { name: /^deactivate$/i }).click();
  await admin.getByRole("button", { name: /^deactivate$/i }).click();
  await expect(
    admin.getByRole("row", { name: new RegExp(email) }).getByText("Inactive"),
  ).toBeVisible();

  await user.goto("/cases");
  await expect(user).toHaveURL(/\/login/);

  for (const c of [adminCtx, reqCtx, userCtx]) await c.close();
});
