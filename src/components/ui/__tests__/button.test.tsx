import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "../button";

afterEach(cleanup);

describe("Button loading state", () => {
  it("shows the loading text and is disabled and busy while loading", () => {
    render(
      <Button loading loadingText="Creating…">
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Creating…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("keeps its own label when no loading text is given", () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("is a normal, enabled button when not loading", () => {
    render(<Button loadingText="Creating…">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");
  });
});
