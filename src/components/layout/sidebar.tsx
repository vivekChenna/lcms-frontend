import { Link } from "@tanstack/react-router";
import { Gavel, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { UserRole } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { navItemsFor } from "./nav-items";

type Props = {
  role: UserRole;
  /** Desktop only: icons-only rail at lg (the md range is always a rail). */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Called after a link is chosen (closes the mobile sheet). */
  onNavigate?: () => void;
  /** "desktop": rail at md, full or collapsed from lg. "sheet": always full (mobile sheet). */
  variant?: "desktop" | "sheet";
};

export function Sidebar({
  role,
  collapsed = false,
  onCollapsedChange,
  onNavigate,
  variant = "desktop",
}: Props) {
  const desktop = variant === "desktop";
  // In the rail the label stays in the DOM as the link's accessible name.
  const hideLabel = desktop && cn("md:max-lg:sr-only", collapsed && "lg:sr-only");
  const centre = desktop && cn("md:max-lg:justify-center", collapsed && "lg:justify-center");

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4",
          centre,
          !desktop && "pr-14",
        )}
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground",
            desktop && collapsed && "lg:hidden",
          )}
        >
          <Gavel className="size-4" aria-hidden />
        </span>
        <span className={cn("min-w-0 flex-1 truncate font-semibold", hideLabel)}>
          Algihaz Legal
        </span>
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
      <nav aria-label="Main navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {navItemsFor(role).map(({ key, label, to, icon: Icon }) => (
          <Link
            key={key}
            to={to}
            title={label}
            onClick={onNavigate}
            activeOptions={{ exact: to === "/" }}
            className={cn(
              "flex h-11 min-w-0 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors lg:h-10",
              centre,
            )}
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
            inactiveProps={{
              className: "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
            }}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span className={cn("truncate", hideLabel)}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
