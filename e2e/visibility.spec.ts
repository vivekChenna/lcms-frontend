import { expect, test, type Browser, type Page } from "@playwright/test";
import { loginAs, submitCase, type Who } from "./fixtures";

async function as(browser: Browser, who: Who): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await loginAs(page, who);
  return page;
}

async function assignTo(manager: Page, casePath: string, repName: string) {
  await manager.goto(casePath);
  await manager.getByRole("button", { name: /^assign$/i }).click();
  await manager.getByLabel(/legal representative/i).click();
  await manager.getByRole("option", { name: repName, exact: true }).click();
  await manager.getByRole("button", { name: /^assign$/i }).last().click();
  await expect(manager.getByText("Assigned", { exact: true }).first()).toBeVisible();
}

test("a confidential case is invisible to the viewer and visible to submitter, manager and rep", async ({ browser }) => {
  test.setTimeout(180_000);
  const title = `E2E confidential ${Date.now()}`;
  const viewer = await as(browser, "viewer");
  await viewer.goto("/");
  const tilesBefore = await viewer.getByTestId("dashboard-tiles").innerText();

  const requester = await as(browser, "requester");
  const casePath = await submitCase(requester, title, { confidential: true });
  await expect(requester.getByText("Confidential", { exact: true }).first()).toBeVisible();

  const manager = await as(browser, "manager");
  await manager.goto(casePath);
  await expect(manager.getByText(title).first()).toBeVisible();
  await assignTo(manager, casePath, "Vivek Legal Rep");

  const rep = await as(browser, "rep1");
  await rep.goto(casePath);
  await expect(rep.getByText(title).first()).toBeVisible();

  // viewer: not in the list, direct URL says not found, dashboard totals unchanged
  await viewer.goto(`/cases?search=${encodeURIComponent(title)}`);
  await expect(viewer.getByText(/no cases match/i)).toBeVisible();
  await viewer.goto(casePath);
  await expect(viewer.getByText("Case not found")).toBeVisible();
  await viewer.goto("/");
  expect(await viewer.getByTestId("dashboard-tiles").innerText()).toBe(tilesBefore);

  for (const p of [viewer, requester, manager, rep]) await p.context().close();
});

test("internal notes and rejection reasons never reach the requester; the manager sees them", async ({ browser }) => {
  test.setTimeout(240_000);
  const requester = await as(browser, "requester");
  const manager = await as(browser, "manager");
  const rep = await as(browser, "rep1");

  // internal note on an accepted case
  const notePath = await submitCase(requester, `E2E private remark ${Date.now()}`);
  await assignTo(manager, notePath, "Vivek Legal Rep");
  await rep.goto(notePath);
  await rep.getByRole("button", { name: /^accept$/i }).click();
  await expect(rep.getByText("In Progress", { exact: true }).first()).toBeVisible();
  await rep.goto(`${notePath}?tab=comments`);
  await rep.getByLabel(/add a comment/i).fill("Secret internal e2e note");
  await rep.getByLabel(/internal note/i).click();
  await rep.getByRole("button", { name: /^post$/i }).click();
  await expect(rep.getByText("Secret internal e2e note")).toBeVisible();

  await requester.goto(`${notePath}?tab=comments`);
  await expect(requester.getByLabel(/add a comment/i)).toBeVisible();
  await expect(requester.getByText("Secret internal e2e note")).toHaveCount(0);
  await requester.goto(`${notePath}?tab=audit`);
  await expect(requester.getByText(/accepted the case/i).first()).toBeVisible();
  await expect(requester.getByText(/internal note/i)).toHaveCount(0);
  await expect(requester.getByText("Secret internal e2e note")).toHaveCount(0);

  // rejection reason on a freshly assigned case
  const rejectPath = await submitCase(requester, `E2E declined hand-off ${Date.now()}`);
  await assignTo(manager, rejectPath, "Vivek Legal Rep");
  await rep.goto(rejectPath);
  await rep.getByRole("button", { name: /^reject$/i }).click();
  await rep.getByLabel(/reason/i).fill("Not within my practice area");
  await rep.getByRole("button", { name: /^confirm$/i }).click();
  await expect(rep.getByText("Submitted", { exact: true }).first()).toBeVisible();

  await requester.goto(`${rejectPath}?tab=audit`);
  await expect(requester.getByText(/submitted the case/i).first()).toBeVisible();
  await expect(requester.getByText("Not within my practice area")).toHaveCount(0);
  await expect(requester.getByText(/rejected/i)).toHaveCount(0);

  await manager.goto(`${rejectPath}?tab=audit`);
  await expect(manager.getByText(/rejected the assignment/i)).toBeVisible();
  await expect(manager.getByText(/Not within my practice area/)).toBeVisible();

  for (const p of [requester, manager, rep]) await p.context().close();
});
