import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SearchInput } from "../search-input";

afterEach(cleanup);

describe("SearchInput", () => {
  it("is a normal text box with no spinner when idle", () => {
    render(<SearchInput aria-label="Search" placeholder="Name or email" />);
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows a spinner inside the box while busy", () => {
    render(<SearchInput aria-label="Search" busy />);
    expect(screen.getByRole("status", { name: /searching/i })).toBeInTheDocument();
  });

  it("keeps the text box usable while busy", () => {
    render(<SearchInput aria-label="Search" busy defaultValue="abc" />);
    expect(screen.getByLabelText("Search")).not.toBeDisabled();
  });
});
