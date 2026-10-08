import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResultsRegion } from "../results-region";

afterEach(cleanup);

describe("ResultsRegion", () => {
  it("shows a labelled spinner instead of the content on the first load", () => {
    render(
      <ResultsRegion initialLoading label="users">
        <p>the table</p>
      </ResultsRegion>,
    );
    expect(screen.getByRole("status", { name: /loading users/i })).toBeInTheDocument();
    expect(screen.queryByText("the table")).not.toBeInTheDocument();
  });

  it("keeps the previous results visible but dimmed while a new search is fetching", () => {
    render(
      <ResultsRegion fetching label="users">
        <p>old results</p>
      </ResultsRegion>,
    );
    expect(screen.getByText("old results")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: /updating users/i })).toBeInTheDocument();
    const region = screen.getByText("old results").closest("[aria-busy]");
    expect(region).toHaveAttribute("aria-busy", "true");
  });

  it("shows no spinner when idle", () => {
    render(
      <ResultsRegion label="users">
        <p>results</p>
      </ResultsRegion>,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("results").closest("[aria-busy]")).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });
});
