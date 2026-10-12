import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("Case types on the Rules & SLAs page", () => {
  it("an admin sees inactive types too, and can add a case type from here", async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/case-categories"))
        return json([{ id: "cat1", name: "Internal", isActive: true }]);
      if (url.includes("/case-types")) {
        if (init?.method === "POST") return json({ id: "t9" });
        return json([
          {
            id: "t1",
            categoryId: "cat1",
            name: "Contract review",
            slaAckHours: 4,
            slaResolutionHours: 72,
            isActive: true,
          },
          {
            id: "t2",
            categoryId: "cat1",
            name: "Retired type",
            slaAckHours: 4,
            slaResolutionHours: 72,
            isActive: false,
          },
        ]);
      }
      return json([]);
    });
    renderWithProviders(<RulesPage />, { me: makeProfile({ role: "admin" }) });

    expect(await screen.findByText("Retired type")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /activate retired type/i })).not.toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: /new case type/i }));
    await userEvent.click(await screen.findByLabelText(/^category$/i));
    await userEvent.click(await screen.findByRole("option", { name: "Internal" }));
    await userEvent.type(screen.getByLabelText(/^name$/i), "Dispute");
    await userEvent.click(screen.getByRole("button", { name: /add case type/i }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(
        (c) =>
          String(c[0]).includes("/case-types") &&
          (c[1] as RequestInit | undefined)?.method === "POST",
      );
      expect(post).toBeDefined();
      expect(JSON.parse(String((post?.[1] as RequestInit).body))).toEqual({
        categoryId: "cat1",
        name: "Dispute",
        slaAckHours: 24,
        slaResolutionHours: 72,
      });
    });
  });

  it("everyone else sees only the active types and no way to add one", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/case-types")) {
        return json([
          {
            id: "t1",
            categoryId: "cat1",
            name: "Contract review",
            slaAckHours: 4,
            slaResolutionHours: 72,
            isActive: true,
          },
          {
            id: "t2",
            categoryId: "cat1",
            name: "Retired type",
            slaAckHours: 4,
            slaResolutionHours: 72,
            isActive: false,
          },
        ]);
      }
      return json([]);
    });
    renderWithProviders(<RulesPage />, { me: makeProfile({ role: "legal_manager" }) });

    expect(await screen.findByText("Contract review")).toBeInTheDocument();
    expect(screen.queryByText("Retired type")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new case type/i })).not.toBeInTheDocument();
  });
});
