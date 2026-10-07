import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatusChart } from "../status-chart";

afterEach(cleanup);

describe("StatusChart", () => {
  it("clips its contents so recharts' tooltip portal cannot overflow the page on narrow screens", () => {
    const { container } = render(<StatusChart byStatus={[{ status: "Submitted", count: 2 }]} />);
    const chartBox = container.querySelector(".recharts-responsive-container")?.parentElement;
    expect(chartBox).not.toBeNull();
    expect(chartBox?.className).toContain("overflow-hidden");
  });
});
