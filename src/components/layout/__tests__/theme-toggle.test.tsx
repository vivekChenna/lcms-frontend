import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setTheme } from "@/lib/theme";
import { ThemeToggle } from "../theme-toggle";

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  setTheme("system");
});

describe("ThemeToggle", () => {
  it("offers Light, Dark and System, with the current choice checked", async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: /theme/i }));
    expect(await screen.findByRole("menuitemradio", { name: /system/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("menuitemradio", { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /dark/i })).toBeInTheDocument();
  });

  it("switching to Dark applies the dark class and remembers it", async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: /theme/i }));
    await userEvent.click(await screen.findByRole("menuitemradio", { name: /dark/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("lcms-theme")).toBe("dark");
  });
});
