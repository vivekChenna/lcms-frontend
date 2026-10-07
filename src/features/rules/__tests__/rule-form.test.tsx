import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeProfile } from "@/test/render";
import { RuleForm } from "../rule-form";

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("RuleForm", () => {
  it("omits unset match criteria entirely (not as null) - the backend only treats a missing key as a wildcard", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/case-categories")) return json([]);
      if (url.includes("/case-types")) return json([{ id: "ct-1", categoryId: "cat-1", name: "A Case Type" }]);
      if (url.includes("/entities")) return json([]);
      if (url.includes("/business-units")) return json([]);
      if (url.includes("/departments")) return json([]);
      if (url.includes("/users?")) return json({ items: [{ id: "rep-1", fullName: "Rex Rep" }], total: 1, page: 1, pageSize: 100 });
      if (url.endsWith("/routing-rules")) return json({ id: "r1", matchCriteria: { caseTypeId: "ct-1" }, targetLegalRepId: "rep-1", priorityOrder: 0, isActive: true }, 201);
      return json({});
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(["me"], makeProfile({ role: "admin" }));
    render(
      <QueryClientProvider client={qc}>
        <RuleForm rule={null} open onOpenChange={() => {}} />
      </QueryClientProvider>,
    );

    await userEvent.click(await screen.findByLabelText(/^case type$/i));
    await userEvent.click(await screen.findByRole("option", { name: "A Case Type" }));
    await userEvent.click(screen.getByLabelText(/assign to/i));
    await userEvent.click(await screen.findByRole("option", { name: "Rex Rep" }));
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        (c) => String(c[0]).endsWith("/routing-rules") && (c[1] as RequestInit)?.method === "POST",
      );
      expect(postCall).toBeDefined();
    });
    const postCall = fetchMock.mock.calls.find(
      (c) => String(c[0]).endsWith("/routing-rules") && (c[1] as RequestInit)?.method === "POST",
    )!;
    const body = JSON.parse(String((postCall[1] as RequestInit).body));
    expect(body.matchCriteria).toEqual({ caseTypeId: "ct-1" });
    expect(body.matchCriteria).not.toHaveProperty("categoryId");
    expect(body.matchCriteria).not.toHaveProperty("entityId");
    expect(body.matchCriteria).not.toHaveProperty("businessUnitId");
    expect(body.matchCriteria).not.toHaveProperty("departmentId");
    expect(body.matchCriteria).not.toHaveProperty("priority");
  });
});
