import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Props = {
  /** What is being loaded, for the screen-reader text: "users", "cases"... */
  label: string;
  /** No data yet (first load): a centred spinner replaces the content. */
  initialLoading?: boolean;
  /** A new search or page is being fetched while the previous results are still shown. */
  fetching?: boolean;
  children: ReactNode;
};

/**
 * Wraps a list of results so every request is visible: a centred spinner on the first load, and on
 * later searches the old results stay in place, dimmed, with an "Updating" badge, so the page never
 * goes blank and the filters above it never unmount.
 */
export function ResultsRegion({ label, initialLoading, fetching, children }: Props) {
  if (initialLoading) {
    return (
      <div
        role="status"
        aria-label={`Loading ${label}`}
        className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"
      >
        <Spinner className="size-5" />
        Loading {label}…
      </div>
    );
  }
  return (
    <div className="relative" aria-busy={fetching ? "true" : "false"}>
      {fetching && (
        <div
          role="status"
          aria-label={`Updating ${label}`}
          className="absolute right-2 top-2 z-20 flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm"
        >
          <Spinner />
          Updating…
        </div>
      )}
      <div className={cn("transition-opacity duration-150", fetching && "opacity-60")}>
        {children}
      </div>
    </div>
  );
}
