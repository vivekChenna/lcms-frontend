import { expect, test, type Browser, type Page } from "@playwright/test";
import { loginAs, type Who } from "./fixtures";

async function as(browser: Browser, who: Who): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await loginAs(page, who);
  return page;
}

test("BRD happy path: submit, assign, accept, request info, respond, comment, escalate, close", async ({ browser }) => {
  test.setTimeout(240_000);
  const title = `E2E workflow ${Date.now()}`;

  // 1. requester submits a case with an attachment
  const requester = await as(browser, "requester");
  await requester.goto("/new-request");
  await requester.getByLabel(/^title$/i).fill(title);
  await requester.getByLabel(/description/i).fill("End-to-end workflow case with plenty of detail to pass validation.");
  await requester.getByLabel(/^category$/i).click();
  await requester.getByRole("option", { name: "Internal", exact: true }).click();
  await requester.getByLabel(/case type/i).click();
  await requester.getByRole("option").first().click();
  await requester.getByLabel(/department/i).click();
  await requester.getByRole("option", { name: "Finance" }).click();
  await requester.getByRole("button", { name: /^next$/i }).click();
  await requester.getByRole("button", { name: /^next$/i }).click();
  await requester.getByLabel(/choose files/i).setInputFiles({
    name: "evidence.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("e2e attachment"),
  });
  await requester.getByLabel(/confirm the information/i).click();
  await requester.getByRole("button", { name: /submit request/i }).click();
  await requester.waitForURL(/\/cases\/[0-9a-f-]+/);
  const casePath = new URL(requester.url()).pathname;
  await expect(requester.getByText("Submitted", { exact: true }).first()).toBeVisible();

  // 2. manager sees it unassigned and assigns it to rep1
  const manager = await as(browser, "manager");
  await manager.goto(casePath);
  await manager.getByRole("button", { name: /^assign$/i }).click();
  await manager.getByLabel(/legal representative/i).click();
  await manager.getByRole("option", { name: "Vivek Legal Rep", exact: true }).click();
  await manager.getByRole("button", { name: /^assign$/i }).last().click();
  await expect(manager.getByText("Assigned", { exact: true }).first()).toBeVisible();

  // 3. rep1 accepts, raises an information request
  const rep = await as(browser, "rep1");
  await rep.goto(casePath);
  await rep.getByRole("button", { name: /^accept$/i }).click();
  await expect(rep.getByText("In Progress", { exact: true }).first()).toBeVisible();
  await rep.getByRole("tab", { name: /information requests/i }).click();
  await rep.getByRole("button", { name: /raise request/i }).click();
  await rep.getByLabel(/^subject$/i).fill("Need the signed agreement");
  await rep.getByLabel(/what do you need/i).fill("Please upload the fully signed agreement.");
  await rep.getByRole("button", { name: /^raise request$/i }).last().click();
  await expect(rep.getByText("Need the signed agreement")).toBeVisible();

  // 4. requester responds; the case returns to In Progress
  await requester.goto(casePath);
  await requester.getByRole("tab", { name: /information requests/i }).click();
  await requester.getByRole("button", { name: /^respond$/i }).click();
  await requester.getByLabel(/your response/i).fill("Attached in the documents tab.");
  await requester.getByRole("button", { name: /send response/i }).click();
  await expect(requester.getByText("Attached in the documents tab.")).toBeVisible();

  // 5. rep1 posts an internal note and a public comment
  await rep.goto(`${casePath}?tab=comments`);
  await rep.getByLabel(/add a comment/i).fill("Internal strategy note.");
  await rep.getByLabel(/internal note/i).click();
  await rep.getByRole("button", { name: /^post$/i }).click();
  await expect(rep.getByText("Internal strategy note.")).toBeVisible();
  // the form clears itself just after the list refreshes; typing before that would be wiped
  await expect(rep.getByLabel(/add a comment/i)).toHaveValue("");
  await rep.getByLabel(/add a comment/i).fill("Public update for the requester.");
  await rep.getByRole("button", { name: /^post$/i }).click();
  await expect(rep.getByText("Public update for the requester.")).toBeVisible();

  // 6. rep1 escalates with a reason, then closes with an outcome
  await rep.goto(casePath);
  await rep.getByRole("button", { name: /^escalate$/i }).click();
  await rep.getByLabel(/reason/i).fill("Counterparty deadline is tomorrow");
  await rep.getByRole("button", { name: /^escalate$/i }).last().click();
  await expect(rep.getByText("Escalated", { exact: true }).first()).toBeVisible();

  await rep.getByRole("button", { name: /^close case$/i }).click();
  await rep.getByLabel(/outcome/i).click();
  await rep.getByRole("option").first().click();
  await rep.getByLabel(/summary/i).fill("Resolved with the signed agreement on file.");
  await rep.getByRole("checkbox").click();
  await rep.getByRole("button", { name: /^close case$/i }).last().click();
  await expect(rep.getByText("Closed", { exact: true }).first()).toBeVisible();
  await expect(rep.getByText("Resolved with the signed agreement on file.")).toBeVisible();

  // 7. the requester received notifications; the bell clears after marking all read
  await requester.goto("/notifications");
  await expect(requester.getByRole("button", { name: /^mark all as read$/i })).toBeVisible();
  await requester.getByRole("button", { name: /^mark all as read$/i }).click();
  await expect(requester.getByRole("button", { name: /^mark all as read$/i })).toHaveCount(0);
  await expect(requester.getByRole("button", { name: /notifications$/i })).toBeVisible();

  // 8. the case audit tab lists the whole sequence (manager sees everything)
  await manager.goto(`${casePath}?tab=audit`);
  for (const phrase of [
    "submitted the case",
    "assigned the case",
    "accepted the case",
    "raised an information request",
    "answered an information request",
    "escalated the case",
    "closed the case",
  ]) {
    await expect(manager.getByText(phrase, { exact: false }).first()).toBeVisible();
  }

  // 9. the dashboard reflects a closed case
  await manager.goto("/");
  await expect(manager.getByText(/closed/i).first()).toBeVisible();

  for (const p of [requester, manager, rep]) await p.context().close();
});
