import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { PasswordInput } from "../password-input";

afterEach(cleanup);

describe("PasswordInput", () => {
  it("hides the value by default and reveals it with the eye button", async () => {
    render(<PasswordInput id="p" aria-label="Secret" defaultValue="hunter22" />);
    const input = screen.getByLabelText("Secret");
    expect(input).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");

    await userEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("keeps the toggle out of the tab order's way of submitting forms", async () => {
    render(
      <form>
        <PasswordInput id="p" aria-label="Secret" />
      </form>,
    );
    expect(screen.getByRole("button", { name: /show password/i })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("passes aria-invalid and other input props through", () => {
    render(<PasswordInput id="p" aria-label="Secret" aria-invalid autoComplete="new-password" />);
    const input = screen.getByLabelText("Secret");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("autocomplete", "new-password");
  });
});
