import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithRouter } from "@/test/router";
import { NotFoundContent } from "../not-found";

afterEach(cleanup);

describe("NotFoundContent", () => {
  it("says plainly that the page does not exist, with an illustration", async () => {
    renderWithRouter(<NotFoundContent />);
    expect(
      await screen.findByRole("heading", { name: /this page doesn't exist/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /question mark/i })).toBeInTheDocument();
    expect(screen.getByText(/error 404/i)).toBeInTheDocument();
  });

  it("offers one way back: the dashboard", async () => {
    renderWithRouter(<NotFoundContent />);
    const link = await screen.findByRole("link", { name: /go to dashboard/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });
});
