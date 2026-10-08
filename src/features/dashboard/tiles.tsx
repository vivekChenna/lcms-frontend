import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Clock, FolderOpen, Hourglass, TriangleAlert, UserX, type LucideIcon } from "lucide-react";
import type { DashboardDto } from "@/lib/api/types";
import { isLegal } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { casesSearch, scrollToResults } from "./use-dashboard";

type Role = Parameters<typeof isLegal>[0];
type TileKey = keyof DashboardDto["tiles"];
type PrimaryDef = { key: TileKey; label: string; hint: string; icon: LucideIcon; danger?: boolean };

const LABEL: Record<TileKey, string> = {
  total: "Total",
  open: "Open",
  awaitingAcceptance: "Awaiting acceptance",
  waitingOnInput: "Waiting on input",
  overdue: "Overdue",
  onTime: "On time",
  closed: "Closed",
  assignedToMe: "Assigned to me",
  unassigned: "Unassigned",
};

const OVERDUE: PrimaryDef = {
  key: "overdue",
  label: LABEL.overdue,
  hint: "Past the resolution deadline",
  icon: TriangleAlert,
  danger: true,
};

// What each audience should act on first. Legal staff triage; everyone else follows their requests.
const PRIMARY_LEGAL: PrimaryDef[] = [
  OVERDUE,
  {
    key: "unassigned",
    label: LABEL.unassigned,
    hint: "Waiting for a representative",
    icon: UserX,
  },
  {
    key: "awaitingAcceptance",
    label: LABEL.awaitingAcceptance,
    hint: "Assigned, not accepted yet",
    icon: Hourglass,
  },
];
const PRIMARY_OTHER: PrimaryDef[] = [
  OVERDUE,
  { key: "open", label: LABEL.open, hint: "Cases still being worked", icon: FolderOpen },
  {
    key: "waitingOnInput",
    label: LABEL.waitingOnInput,
    hint: "Waiting for a response",
    icon: Clock,
  },
];

const ALL_COMMON: TileKey[] = [
  "total",
  "open",
  "awaitingAcceptance",
  "waitingOnInput",
  "overdue",
  "onTime",
  "closed",
];
const ALL_LEGAL: TileKey[] = [...ALL_COMMON, "assignedToMe", "unassigned"];

// The dashboard's one orchestrated moment: the three tiles that need action ease in, in order,
// when the page first loads. It does not replay when the data refreshes.
const ENTRANCE = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const ENTRANCE_ITEM = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
};

function tileKeys(role: Role): TileKey[] {
  return isLegal(role) ? ALL_LEGAL : ALL_COMMON;
}

export function TileSkeleton() {
  return (
    <div
      data-testid="tile-skeleton"
      className="h-20 min-w-0 animate-pulse rounded-lg border bg-muted"
    />
  );
}

export function TilesSkeletonGrid({ role }: { role: Role }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <TileSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: tileKeys(role).length - 3 }, (_, i) => (
          <TileSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function Tiles({
  data,
  role,
  compact,
}: {
  data: DashboardDto;
  role: Role;
  /** The Cases page: one slim strip of counts instead of the dashboard's large action tiles. */
  compact?: boolean;
}) {
  const primary = isLegal(role) ? PRIMARY_LEGAL : PRIMARY_OTHER;
  const primaryKeys = new Set(primary.map((p) => p.key));
  const secondary = tileKeys(role).filter((k) => !primaryKeys.has(k));
  const to = (key: TileKey) => casesSearch(data.filters[key]) as never;

  if (compact) {
    const keys = tileKeys(role);
    return (
      <div data-testid="dashboard-tiles" className="overflow-hidden rounded-xl border bg-card">
        <div
          className="-ml-px -mt-px grid grid-cols-3 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
          style={{ "--n": keys.length } as CSSProperties}
        >
          {keys.map((key) => (
            <Link
              key={key}
              to="/cases"
              search={to(key)}
              hash="results"
              onClick={scrollToResults}
              className="min-h-11 min-w-0 border-l border-t px-3 py-2 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <p className="truncate text-xs text-muted-foreground">{LABEL[key]}</p>
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  key === "overdue" && data.tiles[key] > 0 && "text-danger",
                )}
              >
                {data.tiles[key]}
              </p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-tiles" className="space-y-4">
      <motion.div
        className="grid gap-3 sm:grid-cols-3"
        variants={ENTRANCE}
        initial="hidden"
        animate="show"
      >
        {primary.map(({ key, label, hint, icon: Icon, danger }) => {
          const value = data.tiles[key];
          const alarm = danger && value > 0;
          return (
            <motion.div key={key} variants={ENTRANCE_ITEM} className="min-w-0">
              <Link
                to="/cases"
                search={to(key)}
                hash="results"
                onClick={scrollToResults}
                className={cn(
                  "group flex h-full min-h-11 min-w-0 items-start gap-4 rounded-xl border bg-card p-5 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring",
                  alarm && "border-danger/30 bg-danger/5 hover:bg-danger/10",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
                    alarm && "bg-danger/10 text-danger",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{label}</span>
                  <span
                    className={cn(
                      "block text-3xl font-semibold leading-tight tabular-nums",
                      alarm && "text-danger",
                    )}
                  >
                    {value}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                </span>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Offsetting the grid by 1px and clipping hides the outer edges of the per-cell borders, so
          dividers only appear between cells and unused cells in the last row stay blank. */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div
          className="-ml-px -mt-px grid grid-cols-2 sm:grid-cols-3 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
          style={{ "--n": secondary.length } as CSSProperties}
        >
          {secondary.map((key) => (
            <Link
              key={key}
              to="/cases"
              search={to(key)}
              hash="results"
              onClick={scrollToResults}
              className="min-h-11 min-w-0 border-l border-t px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <p className="truncate text-sm text-muted-foreground">{LABEL[key]}</p>
              <p className="text-xl font-semibold tabular-nums">{data.tiles[key]}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
