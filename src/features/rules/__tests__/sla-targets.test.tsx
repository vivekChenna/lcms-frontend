import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeProfile, renderWithProviders } from "@/test/render";
import { RulesPage } from "../rules-page";
import { formatHours } from "../format-hours";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(async (url: string) => {
    if (url.includes("/case-categories"))
      return json([{ id: "cat1", name: "Internal", isActive: true }]);
    if (url.includes("/case-types")) {
      return json([
        {
          id: "t1",
          categoryId: "cat1",
          name: "Contract review",
          description: null,
          slaAckHours: 4,
          slaResolutionHours: 72,
          isActive: true,
        },
        {
          id: "t2",
          categoryId: "cat1",
          name: "Legal query",
          description: null,
          slaAckHours: 24,
          slaResolutionHours: 8,
          isActive: true,
        },
      ]);
    }
    if (url.includes("/routing-rules")) return json([]);
    return json([]);
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("formatHours", () => {
  it("reads in hours up to two days and in days after that", () => {
    expect(formatHours(1)).toBe("1 hour");
    expect(formatHours(8)).toBe("8 hours");
    expect(formatHours(47)).toBe("47 hours");
    expect(formatHours(48)).toBe("2 days");
    expect(formatHours(72)).toBe("3 days");
    expect(formatHours(90)).toBe("90 hours");
  });
});

describe("Rules & SLAs page", () => {
  it("shows every case type's SLA targets to a requester, read-only, with an explicit notice", async () => {
    renderWithProviders(<RulesPage />, { me: makeProfile({ role: "requester" }) });
    expect(await screen.findByText("Contract review")).toBeInTheDocument();
    const row = screen.getByText("Contract review").closest("tr") as HTMLElement;
    expect(within(row).getByText("Internal")).toBeInTheDocument();
    expect(within(row).getByText("4 hours")).toBeInTheDocument();
    expect(within(row).getByText("3 days")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(
      /read-only.*only administrators can change/i,
    );
    expect(screen.queryByRole("button", { name: /new rule/i })).not.toBeInTheDocument();
  });

  it.each(["viewer", "legal_rep", "legal_manager"] as const)(
    "%s sees the same read-only notice",
    async (role) => {
      renderWithProviders(<RulesPage />, { me: makeProfile({ role }) });
      expect(await screen.findByRole("note")).toHaveTextContent(/read-only/i);
    },
  );

  it("an admin gets no read-only notice and can add a rule", async () => {
    renderWithProviders(<RulesPage />, { me: makeProfile({ role: "admin" }) });
    expect(await screen.findByRole("button", { name: /new rule/i })).toBeInTheDocument();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("does not show a column of assignees that the viewer is not allowed to look up", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/routing-rules")) {
        return json([
          {
            id: "r1",
            matchCriteria: { categoryId: "cat1" },
            targetLegalRepId: "rep1",
            priorityOrder: 1,
            isActive: true,
          },
        ]);
      }
      if (url.includes("/case-categories"))
        return json([{ id: "cat1", name: "Internal", isActive: true }]);
      return json([]);
    });
    renderWithProviders(<RulesPage />, { me: makeProfile({ role: "viewer" }) });
    expect(
      await screen.findByText(
        (_, el) => el?.tagName === "LI" && /Categorys*Internal/.test(el.textContent ?? ""),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /assigned to/i })).not.toBeInTheDocument();
  });
});
