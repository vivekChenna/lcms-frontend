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

/**
 * Statuses are a real sequence (submitted through closed), so they are drawn as one segmented
 * pipeline rather than a bar chart: segment width is the share of all cases.
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
        <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          {rows
            .filter((r) => r.count > 0)
            .map((r) => (
              <div
                key={r.status}
                data-segment={r.status}
                className={cn(
                  "transition-[width] duration-700 ease-out motion-reduce:transition-none",
                  TONE_FILL[statusTone(r.status)],
                )}
                style={{ width: grown ? `${(r.count / total) * 100}%` : "0%" }}
              />
            ))}
        </div>
      )}

      <ul
        aria-label="Cases by status"
        className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {rows.map((r) => (
          <li key={r.status} className="flex min-w-0 items-center gap-2 text-sm">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full",
                r.count > 0 ? TONE_FILL[statusTone(r.status)] : "bg-border",
              )}
              aria-hidden
            />
            <span className="truncate text-muted-foreground">{r.status}</span>
            <span className="font-medium tabular-nums">{r.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
