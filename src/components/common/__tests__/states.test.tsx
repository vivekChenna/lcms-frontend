import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inbox } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { ConfidentialBadge, EscalatedBadge, PriorityBadge, SlaBadge, StatusBadge } from "../badges";
import { EmptyState } from "../empty-state";
import { ErrorState } from "../error-state";
import { PageHeader } from "../page-header";

afterEach(cleanup);

describe("ErrorState", () => {
  it.each([
    [new ApiError(403, "FORBIDDEN", "nope"), "You don't have access to this"],
    [new ApiError(404, "NOT_FOUND", "missing"), "Not found"],
    [new TypeError("Failed to fetch"), "Can't reach the server"],
    [new TypeError("NetworkError when attempting to fetch resource."), "Can't reach the server"],
    [new TypeError("Load failed"), "Can't reach the server"],
    [new TypeError("x is not a function"), "Something went wrong"],
    [new Error("boom"), "Something went wrong"],
    [new ApiError(409, "CONFLICT", "Case is already closed"), "Case is already closed"],
  ])("shows a message for %s", (error, text) => {
    render(<ErrorState error={error} onRetry={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent(text);
  });

  it("retries", async () => {
    const onRetry = vi.fn();
    render(<ErrorState error={new TypeError("x")} onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("EmptyState and PageHeader", () => {
  it("renders title, description and action", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No cases yet"
        description="Cases you can see appear here."
        action={<button type="button">New request</button>}
      />,
    );
    expect(screen.getByText("No cases yet")).toBeInTheDocument();
    expect(screen.getByText("Cases you can see appear here.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New request" })).toBeInTheDocument();
  });

  it("page header renders a heading and actions", () => {
    render(
      <PageHeader
        title="Cases"
        description="All matters"
        actions={<button type="button">Export</button>}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Cases" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });
});

describe("badges", () => {
  it("use the display labels", () => {
    render(
      <div>
        <StatusBadge status="Waiting on Input" />
        <PriorityBadge priority="P1" />
        <SlaBadge state="breached" />
        <ConfidentialBadge />
        <EscalatedBadge />
      </div>,
    );
    expect(screen.getByText("Waiting on Input")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Confidential")).toBeInTheDocument();
    expect(screen.getByText("Escalated")).toBeInTheDocument();
  });
});
