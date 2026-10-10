import { Skeleton } from "@/components/ui/skeleton";
import { isMdUp, useBreakpoint } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";

// Widths vary row to row and column to column so the placeholder reads as text, not a grid.
const WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-5/6", "w-2/5", "w-3/5"];
const width = (row: number, col: number) => WIDTHS[(row * 2 + col) % WIDTHS.length];

/**
 * What a list will look like, drawn as shimmering blocks: a table from md up (header, then rows),
 * tappable cards below md, matching what ResponsiveTable renders for the real data.
 */
export function ListSkeleton({ columns = 6, rows = 6 }: { columns?: number; rows?: number }) {
  const desktop = isMdUp(useBreakpoint());

  if (!desktop) {
    return (
      <ul className="space-y-3">
        {Array.from({ length: Math.min(rows, 4) }, (_, r) => (
          <li key={r} className="space-y-3 rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex gap-4 bg-muted/60 px-3 py-3.5">
        {Array.from({ length: columns }, (_, c) => (
          <Skeleton
            key={c}
            className={cn("h-3", c === 0 ? "w-24" : "w-16", "bg-muted-foreground/15")}
          />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center gap-4 px-3 py-4">
            {Array.from({ length: columns }, (_, c) => (
              <div key={c} className={cn("min-w-0", c === 0 ? "flex-[1.6]" : "flex-1")}>
                {c === 0 ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ) : c === columns - 1 || c === columns - 2 ? (
                  <Skeleton className="h-6 w-16 rounded-full" />
                ) : (
                  <Skeleton className={cn("h-4", width(r, c))} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A stack of bordered cards, for tabs and lists that show cards (comments, requests, files). */
export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/** Rows with an avatar-sized block, for notification-style lists. */
export function RowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y rounded-lg border bg-card">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <Skeleton className="mt-1 size-2.5 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A card holding a chart: heading, a bar, and a legend row. */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 rounded-xl border bg-card p-5", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="flex flex-wrap gap-6">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
    </div>
  );
}

/** The case page before it arrives: back link, reference, title, tab bar and a details card. */
export function CaseDetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-11 w-full max-w-xl rounded-lg" />
      <div className="grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
