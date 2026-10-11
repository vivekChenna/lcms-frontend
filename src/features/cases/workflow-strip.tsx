import { Link } from "@tanstack/react-router";
import { ArrowRight, TriangleAlert } from "lucide-react";
import type { CSSProperties } from "react";
import type { CaseStatus, DashboardDto, UserRole } from "@/lib/api/types";
import { isLegal } from "@/lib/permissions";
import { STATUS_ORDER, statusTone, type Tone } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Props = {
  data: DashboardDto;
  role: UserRole;
  /** The status the list is filtered to right now, if any. */
  activeStatus: CaseStatus | undefined;
};

type TileKey = keyof DashboardDto["tiles"];

// The BRD's summary counts (DR-02) that are not a workflow stage: each is a one-click filter.
// Closed is the last stage of the workflow, and Overdue has the alert above it.
const COUNT_LABEL: Partial<Record<TileKey, string>> = {
  total: "All cases",
  open: "Open",
  awaitingAcceptance: "Awaiting acceptance",
  waitingOnInput: "Waiting on input",
  overdue: "Overdue",
  onTime: "On time",
  unassigned: "Unassigned",
  assignedToMe: "Assigned to me",
};
const COMMON_COUNTS: TileKey[] = [
  "total",
  "open",
  "awaitingAcceptance",
  "waitingOnInput",
  "overdue",
  "onTime",
];
const LEGAL_COUNTS: TileKey[] = [...COMMON_COUNTS, "unassigned", "assignedToMe"];

// Each stage borrows its colour from the app's own tokens, so it follows light and dark mode.
const TONE_COLOUR: Record<Tone, string> = {
  neutral: "var(--muted-foreground)",
  info: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

// An arrow-shaped stage: a notch on the left, a point on the right. The first stage has a flat left
// edge and the last a flat right edge. Below md the stages are plain rounded cards in a grid.
const CHEVRON =
  "md:[clip-path:polygon(0_0,calc(100%-26px)_0,100%_50%,calc(100%-26px)_100%,0_100%,26px_50%)] " +
  "md:first:[clip-path:polygon(0_0,calc(100%-26px)_0,100%_50%,calc(100%-26px)_100%,0_100%)] " +
  "md:last:[clip-path:polygon(0_0,100%_0,100%_100%,0_100%,26px_50%)]";

/**
 * The top of the Cases page: an alert for what is overdue, then the case workflow drawn as a row
 * of arrows, Submitted through Closed, each with its count. Every part filters the list below it
 * and brings the list into view (BRD UI-07, UI-08).
 */
export function WorkflowStrip({ data, role, activeStatus }: Props) {
  const byStatus = data.byStatus ?? [];
  const overdue = data.tiles.overdue;
  const overdueSearch = data.filters["overdue"];
  // while the alert is up, Overdue is not repeated as a chip
  const counts = (isLegal(role) ? LEGAL_COUNTS : COMMON_COUNTS).filter(
    (k) => !(k === "overdue" && overdue > 0),
  );
  const rows = STATUS_ORDER.map((status) => ({
    status,
    count: byStatus.find((s) => s.status === status)?.count ?? 0,
  }));

  return (
    <div className="space-y-4">
      {overdue > 0 && (
        <Link
          to="/cases"
          search={{ ...overdueSearch } as never}
          className="group flex min-h-12 items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-danger transition-colors hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <TriangleAlert className="size-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 text-sm">
            <b className="font-semibold">
              {overdue} {overdue === 1 ? "case is" : "cases are"} past the deadline.
            </b>{" "}
            <span className="opacity-80">Review these first.</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
            Review overdue
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </Link>
      )}

      <nav
        aria-label="Case workflow"
        className="grid grid-cols-2 gap-2 md:flex md:gap-0 md:drop-shadow-sm"
      >
        {rows.map(({ status, count }, i) => {
          const active = activeStatus === status;
          return (
            <Link
              key={status}
              to="/cases"
              search={{ status } as never}
              data-stage={status}
              data-active={active ? "true" : undefined}
              style={{ "--tone": TONE_COLOUR[statusTone(status)] } as CSSProperties}
              className={cn(
                "relative flex min-h-16 flex-col justify-center rounded-xl px-4 py-3 transition-[filter,background-color] hover:brightness-95 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-ring md:h-[92px] md:flex-1 md:rounded-none md:px-8",
                "bg-[color-mix(in_oklab,var(--tone)_14%,var(--card))]",
                active && "bg-[color-mix(in_oklab,var(--tone)_30%,var(--card))]",
                count === 0 && !active && "opacity-60",
                i > 0 && "md:-ml-4",
                i === 0 && "md:pl-6",
                i === rows.length - 1 && "col-span-2 md:col-span-1 md:pr-6",
                CHEVRON,
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="size-2 shrink-0 rounded-full bg-[var(--tone)]" aria-hidden />
                {status}
              </span>
              <span className="mt-1 text-3xl font-semibold leading-none tracking-tight tabular-nums">
                {count}
              </span>
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1 bg-[var(--tone)] md:inset-x-7"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <ul aria-label="Case counts" className="flex flex-wrap gap-2">
        {counts.map((key) => (
          <li key={key}>
            <Link
              to="/cases"
              search={{ ...data.filters[key] } as never}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border bg-card px-3.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {COUNT_LABEL[key]}
              <b
                className={cn(
                  "font-semibold tabular-nums text-foreground",
                  key === "overdue" && data.tiles[key] > 0 && "text-danger",
                )}
              >
                {data.tiles[key]}
              </b>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
