import { cleanup, screen, within, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { StatusChart } from "../status-chart";

afterEach(cleanup);

const byStatus = [
  { status: "Submitted" as const, count: 3 },
  { status: "In Progress" as const, count: 1 },
  { status: "Closed" as const, count: 0 },
];

// the router renders its first frame asynchronously
async function renderChart(ui: ReactNode) {
  const result = renderWithProviders(ui);
  await screen.findByRole("heading", { name: /cases by status/i });
  return result;
}

describe("StatusChart", () => {
  it("lists every status in pipeline order with its count, including zeros", async () => {
    await renderChart(<StatusChart byStatus={byStatus} />);
    const list = within(screen.getByRole("list", { name: /cases by status/i }));
    const items = list.getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual([
      "Submitted3",
      "Assigned0",
      "In Progress1",
      "Waiting on Input0",
      "Closed0",
    ]);
  });

  it("draws one proportional segment per non-empty status", async () => {
    const { container } = await renderChart(<StatusChart byStatus={byStatus} />);
    const segments = container.querySelectorAll("[data-segment]");
    expect(segments).toHaveLength(2);
    // the bars grow in right after mount, so wait for the final widths rather than read them at once
    await waitFor(() => expect((segments[0] as HTMLElement).style.width).toBe("75%"));
    expect((segments[1] as HTMLElement).style.width).toBe("25%");
  });

  it("says so instead of drawing an empty bar when there are no cases", async () => {
    renderWithProviders(<StatusChart byStatus={[]} />);
    expect(await screen.findByText(/no cases yet/i)).toBeInTheDocument();
  });

  it("every bar segment filters the case list to its status", async () => {
    const { container } = await renderChart(<StatusChart byStatus={byStatus} />);
    const submitted = container.querySelector('[data-segment="Submitted"]') as HTMLElement;
    expect(submitted.tagName).toBe("A");
    expect(submitted.getAttribute("href")).toMatch(/^\/cases\?.*status=Submitted/);
    expect(submitted).toHaveAccessibleName(/submitted: 3 cases/i);
    const inProgress = container.querySelector('[data-segment="In Progress"]') as HTMLElement;
    expect(inProgress.getAttribute("href")).toMatch(/status=In(\+|%20)Progress/);
  });

  it("every legend entry, even an empty one, filters the case list too", async () => {
    await renderChart(<StatusChart byStatus={byStatus} />);
    const list = within(screen.getByRole("list", { name: /cases by status/i }));
    for (const status of ["Submitted", "Assigned", "In Progress", "Waiting on Input", "Closed"]) {
      const link = list.getByRole("link", { name: new RegExp(status, "i") });
      expect(link.getAttribute("href")).toMatch(/^\/cases\?.*status=/);
    }
  });

  it("makes the touch targets a comfortable size on phones", async () => {
    await renderChart(<StatusChart byStatus={byStatus} />);
    const link = within(screen.getByRole("list", { name: /cases by status/i })).getByRole("link", {
      name: /submitted/i,
    });
    expect(link.className).toContain("min-h-11");
  });
});
