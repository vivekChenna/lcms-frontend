import type { KeyboardEvent, ReactNode } from "react";
import { isMdUp, useBreakpoint } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  /**
   * Max-width class (e.g. "max-w-56"). The cell stays on one line and ends in an ellipsis; give
   * `title` so the full text is still reachable on hover.
   */
  truncate?: string;
  title?: (row: T) => string | undefined;
  /** Pin the column to the right edge while the table scrolls sideways (row actions). */
  sticky?: boolean;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Accessible name of a clickable desktop row, e.g. "Open case LC-2026-184". */
  rowLabel?: (row: T) => string;
  /**
   * Phone layout: title line, 2-4 labelled key facts, badges row. With `onRowClick` the card is
   * wrapped in a <button>, so it must NOT contain interactive elements (links, buttons, inputs).
   * Desktop `columns` cells may contain them.
   */
  renderCard: (row: T) => ReactNode;
  /** Phone layout: buttons shown under a clickable card, outside its <button>. */
  cardFooter?: (row: T) => ReactNode;
  empty?: ReactNode;
  /** Wrapper classes, e.g. a max height so the sticky header sticks while the table scrolls. */
  className?: string;
};

/** A real table from md up (scrolls sideways inside its own wrapper); tappable cards below md. */
export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowLabel,
  renderCard,
  cardFooter,
  empty,
  className,
}: Props<T>) {
  const desktop = isMdUp(useBreakpoint());
  if (rows.length === 0) return <>{empty}</>;

  if (!desktop) {
    return (
      <ul className={cn("space-y-3", className)}>
        {rows.map((row) => (
          <li key={rowKey(row)}>
            {onRowClick ? (
              <button
                type="button"
                onClick={() => onRowClick(row)}
                className="block min-h-11 w-full min-w-0 rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-2"
              >
                {renderCard(row)}
              </button>
            ) : (
              <div className="min-h-11 min-w-0 rounded-lg border bg-card p-4 shadow-sm">
                {renderCard(row)}
              </div>
            )}
            {cardFooter && <div className="mt-2">{cardFooter(row)}</div>}
          </li>
        ))}
      </ul>
    );
  }

  const onKey = (e: KeyboardEvent, row: T) => {
    // only the focused row itself; a link or button inside a cell handles its own keys
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick?.(row);
    }
  };

  return (
    <div className={cn("overflow-x-auto rounded-lg border bg-card", className)}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-muted text-left text-xs font-medium text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "whitespace-nowrap px-3 py-3",
                  c.sticky && "sticky right-0 bg-muted",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              {...(onRowClick
                ? {
                    onClick: () => onRowClick(row),
                    onKeyDown: (e: KeyboardEvent) => onKey(e, row),
                    tabIndex: 0,
                    ...(rowLabel ? { "aria-label": rowLabel(row) } : {}),
                    className:
                      "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  }
                : {})}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "whitespace-nowrap px-3 py-3 align-middle",
                    c.sticky && "sticky right-0 bg-card",
                    c.className,
                  )}
                >
                  {c.truncate ? (
                    <div className={cn("truncate", c.truncate)} title={c.title?.(row)}>
                      {c.cell(row)}
                    </div>
                  ) : (
                    c.cell(row)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
