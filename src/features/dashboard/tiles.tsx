import { Link } from "@tanstack/react-router";
import type { DashboardDto } from "@/lib/api/types";
import { isLegal } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { casesSearch } from "./use-dashboard";

type TileKey = keyof DashboardDto["tiles"];
type TileDef = { key: TileKey; label: string; tone?: "danger" };

const COMMON_TILES: TileDef[] = [
  { key: "total", label: "Total" },
  { key: "open", label: "Open" },
  { key: "awaitingAcceptance", label: "Awaiting acceptance" },
  { key: "waitingOnInput", label: "Waiting on input" },
  { key: "overdue", label: "Overdue", tone: "danger" },
  { key: "onTime", label: "On time" },
  { key: "closed", label: "Closed" },
];

const LEGAL_TILES: TileDef[] = [
  { key: "assignedToMe", label: "Assigned to me" },
  { key: "unassigned", label: "Unassigned" },
];

export function TileSkeleton() {
  return (
    <div
      data-testid="tile-skeleton"
      className="h-20 min-w-0 animate-pulse rounded-lg border bg-muted"
    />
  );
}

export function TilesSkeletonGrid({ role }: { role: Parameters<typeof isLegal>[0] }) {
  const count = isLegal(role) ? COMMON_TILES.length + LEGAL_TILES.length : COMMON_TILES.length;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <TileSkeleton key={i} />
      ))}
    </div>
  );
}

export function Tiles({ data, role }: { data: DashboardDto; role: Parameters<typeof isLegal>[0] }) {
  const defs = isLegal(role) ? [...COMMON_TILES, ...LEGAL_TILES] : COMMON_TILES;
  return (
    <div
      data-testid="dashboard-tiles"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      {defs.map(({ key, label, tone }) => (
        <Link
          key={key}
          to="/cases"
          search={casesSearch(data.filters[key]) as never}
          className={cn(
            "min-h-11 min-w-0 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-2",
            tone === "danger" && data.tiles[key] > 0 && "border-danger/30 bg-danger/5",
          )}
        >
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.tiles[key]}</p>
        </Link>
      ))}
    </div>
  );
}
