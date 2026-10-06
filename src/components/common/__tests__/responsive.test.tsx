import { act, cleanup, render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { setViewport } from "@/test/media";
import { ConfirmDialog } from "../confirm-dialog";
import { FilterSheet } from "../filter-sheet";
import { ResponsiveDialog } from "../responsive-dialog";
import { ResponsiveTable } from "../responsive-table";

afterEach(cleanup);

type Row = { id: string; title: string; owner: string };
const rows: Row[] = [
  { id: "1", title: "Lease renewal", owner: "Faisal" },
  { id: "2", title: "Vendor audit", owner: "Reem" },
];

function Table({
  onRowClick,
  rowLabel,
}: {
  onRowClick?: (r: Row) => void;
  rowLabel?: (r: Row) => string;
}) {
  return (
    <ResponsiveTable
      columns={[
        { key: "title", header: "Title", cell: (r) => r.title },
        { key: "owner", header: "Owner", cell: (r) => r.owner },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      renderCard={(r) => <span>card {r.title}</span>}
      empty={<p>No cases</p>}
      {...(onRowClick ? { onRowClick } : {})}
      {...(rowLabel ? { rowLabel } : {})}
    />
  );
}

function Dialog() {
  return (
    <ResponsiveDialog
      open
      onOpenChange={() => {}}
      title="Edit case"
      description="Change the details"
      footer={<button type="button">Save</button>}
    >
      <p>Body</p>
    </ResponsiveDialog>
  );
}

describe("useBreakpoint", () => {
  it.each([
    [320, "base"],
    [767, "sm"],
    [768, "md"],
    [1023, "md"],
    [1024, "lg"],
    [1280, "xl"],
  ] as const)("%ipx is %s", (width, bucket) => {
    setViewport(width);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe(bucket);
  });

  it("updates when the viewport crosses a breakpoint", () => {
    setViewport(390);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("base");
    act(() => setViewport(1280));
    expect(result.current).toBe("xl");
    act(() => setViewport(800));
    expect(result.current).toBe("md");
  });
});

describe("at 390px (phone)", () => {
  it("ResponsiveTable renders tappable cards, no table", async () => {
    setViewport(390);
    const onRowClick = vi.fn();
    render(<Table onRowClick={onRowClick} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("card Lease renewal")).toBeInTheDocument();
    await userEvent.click(screen.getByText("card Vendor audit"));
    expect(onRowClick).toHaveBeenCalledWith(rows[1]);
  });

  it("ResponsiveDialog renders the bottom drawer variant", () => {
    setViewport(390);
    render(<Dialog />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-variant", "drawer");
    expect(dialog).toHaveAttribute("data-vaul-drawer");
    expect(within(dialog).getByText("Edit case")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("FilterSheet collapses filters behind a Filters (n) button", async () => {
    setViewport(390);
    const onClear = vi.fn();
    render(
      <FilterSheet activeCount={2} onClear={onClear}>
        <label>
          Status <input />
        </label>
      </FilterSheet>,
    );
    expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Filters (2)" }));
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByLabelText("Status")).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole("button", { name: /clear/i }));
    expect(onClear).toHaveBeenCalled();
  });
});

describe("at 1280px (desktop)", () => {
  it("ResponsiveTable renders a real table with headers", async () => {
    setViewport(1280);
    const onRowClick = vi.fn();
    render(<Table onRowClick={onRowClick} />);
    const table = screen.getByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Title", "Owner"]);
    expect(screen.queryByText("card Lease renewal")).not.toBeInTheDocument();
    await userEvent.click(within(table).getByText("Vendor audit"));
    expect(onRowClick).toHaveBeenCalledWith(rows[1]);
  });

  it("ResponsiveTable rows are keyboard-operable with an accessible label", async () => {
    setViewport(1280);
    const onRowClick = vi.fn();
    render(<Table onRowClick={onRowClick} rowLabel={(r) => `Open ${r.title}`} />);
    const row = screen.getByRole("row", { name: "Open Vendor audit" });
    expect(row).toHaveAttribute("tabindex", "0");
    expect(row.className).toContain("focus-visible:outline-ring");
    row.focus();
    await userEvent.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenCalledWith(rows[1]);
    onRowClick.mockClear();
    await userEvent.keyboard(" ");
    expect(onRowClick).toHaveBeenCalledWith(rows[1]);
  });

  it("ResponsiveTable shows the empty state when there are no rows", () => {
    setViewport(1280);
    render(
      <ResponsiveTable
        columns={[{ key: "t", header: "T", cell: () => null }]}
        rows={[]}
        rowKey={() => "x"}
        renderCard={() => null}
        empty={<p>No cases</p>}
      />,
    );
    expect(screen.getByText("No cases")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("ResponsiveDialog renders the centered dialog", () => {
    setViewport(1280);
    render(<Dialog />);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-variant", "dialog");
    expect(screen.getByRole("dialog")).not.toHaveAttribute("data-vaul-drawer");
  });

  it("FilterSheet shows filters inline", () => {
    setViewport(1280);
    render(
      <FilterSheet activeCount={0} onClear={() => {}}>
        <label>
          Status <input />
        </label>
      </FilterSheet>,
    );
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /filters/i })).not.toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it.each([390, 1280])("confirms and cancels at %ipx", async (width) => {
    setViewport(width);
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Close case?"
        description="This cannot be undone."
        confirmLabel="Close case"
        destructive
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Close case" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it.each([390, 1280])("ignores close requests while pending at %ipx", async (width) => {
    setViewport(width);
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Close case?"
        description="x"
        confirmLabel="Close case"
        pending
        onConfirm={() => {}}
        onOpenChange={onOpenChange}
      />,
    );
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("disables confirm while pending", () => {
    setViewport(1280);
    render(
      <ConfirmDialog
        open
        title="Close case?"
        description="x"
        confirmLabel="Close case"
        pending
        onConfirm={() => {}}
        onOpenChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /close case/i })).toBeDisabled();
  });
});
