import { expect, test, type Page } from "@playwright/test";
import { chooseNewPassword, inviteUser, loginAs, signInAs } from "./fixtures";
import { mailCount, tokenFromMail, waitForNewMail } from "./mail";

const newUser = () => {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return { stamp, email: `e2e-link-${stamp}@example.com`, fullName: `E2E Link ${stamp}` };
};

async function deadLinkPage(page: Page) {
  await expect(page.getByRole("heading", { name: /this link is no longer valid/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /send me a new link/i })).toBeVisible();
}

test("a link works once: opening it again shows a dead-link page that offers a new one", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { email, fullName } = newUser();
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await loginAs(admin, "admin");
  const token = await inviteUser(admin, fullName, email);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await chooseNewPassword(page, token, "First#Passw0rd1");

  // the same link again: the server refuses it, and the page says so instead of looping
  await page.goto(`/set-password?token=${token}`);
  await page.getByLabel(/^new password$/i).fill("Second#Passw0rd2");
  await page.getByLabel(/^confirm password$/i).fill("Second#Passw0rd2");
  await page.getByRole("button", { name: /set password/i }).click();
  await deadLinkPage(page);
  await page.getByRole("link", { name: /send me a new link/i }).click();
  await expect(page).toHaveURL(/\/forgot-password/);

  // the first password still works, the second never took effect
  await signInAs(page, email, "First#Passw0rd1");
  await adminCtx.close();
  await ctx.close();
});

test("the form checks the password before sending anything, and a missing or bogus link is a dead end with a way out", async ({
  page,
}) => {
  await page.goto("/set-password?token=" + "0".repeat(64));
  await page.getByRole("button", { name: /set password/i }).click();
  await expect(page.getByText(/enter a new password/i)).toBeVisible();

  await page.getByLabel(/^new password$/i).fill("short");
  await page.getByLabel(/^confirm password$/i).fill("short");
  await page.getByRole("button", { name: /set password/i }).click();
  await expect(page.getByText(/use at least 8 characters/i)).toBeVisible();

  await page.getByLabel(/^new password$/i).fill("Long-Enough#1");
  await page.getByLabel(/^confirm password$/i).fill("Different#Passw0rd");
  await page.getByRole("button", { name: /set password/i }).click();
  await expect(page.getByText(/passwords do not match/i)).toBeVisible();

  // a well-formed form with a token the server never issued
  await page.getByLabel(/^confirm password$/i).fill("Long-Enough#1");
  await page.getByRole("button", { name: /set password/i }).click();
  await deadLinkPage(page);

  // no token at all
  await page.goto("/set-password");
  await deadLinkPage(page);
});

test("the token is taken out of the address bar once the page has loaded", async ({ browser }) => {
  const { email, fullName } = newUser();
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await loginAs(admin, "admin");
  const token = await inviteUser(admin, fullName, email);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`/set-password?token=${token}`);
  await expect(page.getByRole("heading", { name: /choose your password/i })).toBeVisible();
  await expect(page).not.toHaveURL(/token=/);
  // the form still works with the token held in memory
  await page.getByLabel(/^new password$/i).fill("Held#In#Memory1");
  await page.getByLabel(/^confirm password$/i).fill("Held#In#Memory1");
  await page.getByRole("button", { name: /set password/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await adminCtx.close();
  await ctx.close();
});

test("forgot password: ask for a link, choose a new password, and the old one stops working", async ({
  browser,
}) => {
  test.setTimeout(150_000);
  const { email, fullName } = newUser();
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await loginAs(admin, "admin");
  const inviteToken = await inviteUser(admin, fullName, email);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await chooseNewPassword(page, inviteToken, "Old#Passw0rd1");

  // from the sign-in page, through the link
  await page.goto("/login");
  await page.getByRole("link", { name: /forgot password\?/i }).click();
  await expect(page).toHaveURL(/\/forgot-password/);
  const before = await mailCount(email);
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByRole("button", { name: /send link/i }).click();
  await expect(page.getByRole("status")).toContainText(/if that account exists/i);

  const mail = await waitForNewMail(email, before);
  expect(mail.subject).toMatch(/reset your password/i);
  await chooseNewPassword(page, tokenFromMail(mail), "New#Passw0rd2");

  await page.getByLabel(/email/i).fill(email);
  await page.getByRole("textbox", { name: /password/i }).fill("Old#Passw0rd1");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByRole("alert")).toContainText(/invalid email or password/i);
  await signInAs(page, email, "New#Passw0rd2");
  await adminCtx.close();
  await ctx.close();
});

test("forgot password gives the same answer for an address that has no account, and sends nothing", async ({
  page,
}) => {
  const nobody = `nobody-${Date.now()}@example.com`;
  await page.goto("/forgot-password");
  await page.getByLabel(/^email$/i).fill(nobody);
  await page.getByRole("button", { name: /send link/i }).click();
  await expect(page.getByRole("status")).toContainText(/if that account exists/i);
  await page.waitForTimeout(1500);
  expect(await mailCount(nobody)).toBe(0);
});

test("admin can resend an invitation: the new link works and the earlier one is cancelled", async ({
  browser,
}) => {
  test.setTimeout(150_000);
  const { email, fullName } = newUser();
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await loginAs(admin, "admin");
  const first = await inviteUser(admin, fullName, email);

  const before = await mailCount(email);
  await admin.getByRole("button", { name: `Actions for ${fullName}` }).click();
  await admin.getByRole("menuitem", { name: /resend invite/i }).click();
  await expect(admin.getByRole("dialog")).toContainText(email);
  await admin.getByRole("button", { name: /^send link$/i }).click();
  const second = tokenFromMail(await waitForNewMail(email, before));
  expect(second).not.toBe(first);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`/set-password?token=${first}`);
  await page.getByLabel(/^new password$/i).fill("Cancelled#Passw0rd1");
  await page.getByLabel(/^confirm password$/i).fill("Cancelled#Passw0rd1");
  await page.getByRole("button", { name: /set password/i }).click();
  await deadLinkPage(page);

  await chooseNewPassword(page, second, "Fresh#Passw0rd1");
  await signInAs(page, email, "Fresh#Passw0rd1");
  await adminCtx.close();
  await ctx.close();
});
