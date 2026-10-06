import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pagination } from "../pagination";

afterEach(cleanup);

describe("Pagination", () => {
  it("shows the range text", () => {
    render(<Pagination page={1} pageSize={20} total={134} onPageChange={() => {}} />);
    expect(screen.getByText("1–20 of 134")).toBeInTheDocument();
  });

  it("shows a partial last page", () => {
    render(<Pagination page={7} pageSize={20} total={134} onPageChange={() => {}} />);
    expect(screen.getByText("121–134 of 134")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /previous/i })).toBeEnabled();
  });

  it("disables previous on page 1 and moves forward", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageSize={20} total={134} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("moves back", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageSize={20} total={134} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("is hidden when everything fits on one page", () => {
    const { container } = render(
      <Pagination page={1} pageSize={20} total={20} onPageChange={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
