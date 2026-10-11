import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { UserRole } from "@/lib/api/types";
import { AlgihazLogo } from "@/components/brand/algihaz-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { navItemsFor } from "./nav-items";

type Props = {
  /** Whose menu to show. Left out while the session is still loading: the menu is drawn as shimmering placeholders. */
  role?: UserRole | undefined;
  /** Desktop only: icons-only rail at lg (the md range is always a rail). */
  collapsed?: boolean;
  /**
   * False while the width is still animating after a collapse: the labels fade out first and the
   * icon-only look (labels hidden, icons centred) only takes over once this is true. Defaults to
   * true, i.e. no animation in flight.
   */
  settled?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Called after a link is chosen (closes the mobile sheet). */
  onNavigate?: () => void;
  /** "desktop": rail at md, full or collapsed from lg. "sheet": always full (mobile sheet). */
  variant?: "desktop" | "sheet";
};

export function Sidebar({
  role,
  collapsed = false,
  settled = true,
  onCollapsedChange,
  onNavigate,
  variant = "desktop",
}: Props) {
  const desktop = variant === "desktop";
  const rail = collapsed && settled;
  // In the rail the label stays in the DOM as the link's accessible name.
  const hideLabel = desktop && cn("md:max-lg:sr-only", rail && "lg:sr-only");
  const centre = desktop && cn("md:max-lg:justify-center", rail && "lg:justify-center");
  // labels fade with the width animation; the sheet and the md rail are unaffected
  const labelFade = { opacity: desktop && collapsed ? 0 : 1 };

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4",
          centre,
          !desktop && "pr-14",
        )}
      >
        <Link
          to="/dashboard"
          aria-label="Algihaz Holding, go to the dashboard"
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center rounded-md md:max-lg:flex-none"
        >
          {/* the round emblem alone where there is only room for an icon: the md rail */}
          <AlgihazLogo variant="mark" className={cn("h-8", desktop ? "lg:hidden" : "hidden")} />
          {/* the full logo in the sheet and in the expanded desktop sidebar; fades with the width animation */}
          <motion.div
            initial={false}
            animate={labelFade}
            transition={{ duration: 0.16 }}
            className={desktop ? cn("hidden lg:block", rail && "lg:hidden") : "block"}
          >
            <AlgihazLogo className="h-8" />
          </motion.div>
        </Link>
        {desktop && onCollapsedChange && (
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => onCollapsedChange(!collapsed)}
            className="hidden size-9 shrink-0 place-items-center rounded-md text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground lg:grid"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </button>
        )}
      </div>
      <nav
        aria-label="Main navigation"
        aria-busy={role === undefined}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2"
      >
        {role === undefined &&
          Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              data-testid="nav-skeleton"
              className={cn("flex h-11 items-center gap-3 px-3 opacity-20 lg:h-10", centre)}
            >
              <Skeleton className="size-5 shrink-0" />
              <Skeleton
                className={cn("h-4 flex-1", desktop && cn("md:max-lg:hidden", rail && "lg:hidden"))}
              />
            </div>
          ))}
        {role !== undefined &&
          navItemsFor(role).map(({ key, label, to, icon: Icon }) => (
            <Link
              key={key}
              to={to}
              title={label}
              onClick={onNavigate}
              activeOptions={{ exact: to === "/dashboard" }}
              className={cn(
                "flex h-11 min-w-0 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors lg:h-10",
                centre,
              )}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              inactiveProps={{
                className:
                  "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
              }}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <motion.span
                initial={false}
                animate={labelFade}
                transition={{ duration: 0.16 }}
                className={cn("truncate", hideLabel)}
              >
                {label}
              </motion.span>
            </Link>
          ))}
      </nav>
    </div>
  );
}
