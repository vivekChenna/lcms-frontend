import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatusChart } from "../status-chart";

afterEach(cleanup);

const byStatus = [
  { status: "Submitted" as const, count: 3 },
  { status: "In Progress" as const, count: 1 },
  { status: "Closed" as const, count: 0 },
];

describe("StatusChart", () => {
  it("lists every status in pipeline order with its count, including zeros", () => {
    render(<StatusChart byStatus={byStatus} />);
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

  it("draws one proportional segment per non-empty status", () => {
    const { container } = render(<StatusChart byStatus={byStatus} />);
    const segments = container.querySelectorAll("[data-segment]");
    expect(segments).toHaveLength(2);
    expect((segments[0] as HTMLElement).style.width).toBe("75%");
    expect((segments[1] as HTMLElement).style.width).toBe("25%");
  });

  it("says so instead of drawing an empty bar when there are no cases", () => {
    render(<StatusChart byStatus={[]} />);
    expect(screen.getByText(/no cases yet/i)).toBeInTheDocument();
  });
});
