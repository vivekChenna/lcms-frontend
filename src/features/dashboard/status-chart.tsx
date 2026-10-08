import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { CaseStatus } from "@/lib/api/types";
import { STATUS_ORDER, statusTone, type Tone } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Props = { byStatus: { status: CaseStatus; count: number }[] };

const TONE_FILL: Record<Tone, string> = {
  neutral: "bg-muted-foreground/40",
  info: "bg-primary/60",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** The case list filtered to one status (BRD UI-07: every chart bar applies its filter). */
const toStatus = (status: CaseStatus) => ({ status }) as never;

/**
 * Statuses are a real sequence (submitted through closed), so they are drawn as one segmented
 * pipeline rather than a bar chart: segment width is the share of all cases. Every segment and
 * every legend entry opens the case list filtered to that status.
 */
export function StatusChart({ byStatus }: Props) {
  // segments start at zero width and grow once on first paint
  const [grown, setGrown] = useState(false);
  useEffect(() => setGrown(true), []);
  const rows = STATUS_ORDER.map((status) => ({
    status,
    count: byStatus.find((s) => s.status === status)?.count ?? 0,
  }));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <section aria-labelledby="status-heading" className="rounded-xl border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="status-heading" className="text-base font-semibold">
          Cases by status
        </h2>
        <p className="text-sm text-muted-foreground tabular-nums">{total} in total</p>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No cases yet.</p>
      ) : (
        <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
          {rows
            .filter((r) => r.count > 0)
            .map((r) => (
              <Link
                key={r.status}
                to="/cases"
                search={toStatus(r.status)}
                data-segment={r.status}
                aria-label={`${r.status}: ${r.count} ${r.count === 1 ? "case" : "cases"}`}
                title={`${r.status}: ${r.count}`}
                className={cn(
                  "block transition-[width,opacity] duration-700 ease-out hover:opacity-80 focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none",
                  TONE_FILL[statusTone(r.status)],
                )}
                style={{ width: grown ? `${(r.count / total) * 100}%` : "0%" }}
              />
            ))}
        </div>
      )}

      <ul
        aria-label="Cases by status"
        className="mt-3 grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        {rows.map((r) => (
          <li key={r.status} className="min-w-0">
            <Link
              to="/cases"
              search={toStatus(r.status)}
              className="flex min-h-11 min-w-0 items-center gap-2 rounded-md px-1 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  r.count > 0 ? TONE_FILL[statusTone(r.status)] : "bg-border",
                )}
                aria-hidden
              />
              <span className="truncate text-muted-foreground">{r.status}</span>
              <span className="font-medium tabular-nums">{r.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
