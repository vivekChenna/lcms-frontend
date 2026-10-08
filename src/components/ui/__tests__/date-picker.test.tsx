import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatePicker } from "../date-picker";

afterEach(cleanup);

function Harness({ initial = "", onChange }: { initial?: string; onChange?: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <DatePicker
      id="d"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

describe("DatePicker", () => {
  it("shows a placeholder when empty and a formatted date when set", () => {
    const { rerender } = render(
      <DatePicker id="d" value="" onChange={() => {}} placeholder="Pick a date" />,
    );
    expect(screen.getByRole("button", { name: /pick a date/i })).toBeInTheDocument();
    rerender(<DatePicker id="d" value="2026-10-08" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /08 oct 2026/i })).toBeInTheDocument();
  });

  it("emits a YYYY-MM-DD string when a day is chosen, and closes", async () => {
    const onChange = vi.fn();
    render(<Harness initial="2026-10-08" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /08 oct 2026/i }));
    await userEvent.click(screen.getByRole("button", { name: /october 15th, 2026/i }));
    expect(onChange).toHaveBeenCalledWith("2026-10-15");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /15 oct 2026/i })).toBeInTheDocument();
  });

  it("clears the value with the Clear button", async () => {
    const onChange = vi.fn();
    render(<Harness initial="2026-10-08" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /08 oct 2026/i }));
    await userEvent.click(screen.getByRole("button", { name: /^clear$/i }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("does not open when disabled", async () => {
    render(<DatePicker id="d" value="" onChange={() => {}} disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("marks the trigger invalid for assistive tech", () => {
    render(<DatePicker id="d" value="" onChange={() => {}} aria-invalid />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-invalid", "true");
  });
});
