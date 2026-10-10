import {
  BarChart3,
  Bell,
  Database,
  FilePlus2,
  FolderOpen,
  GitBranch,
  LayoutDashboard,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/api/types";
import { canSee, type NavKey } from "@/lib/permissions";

export type NavItem = {
  key: NavKey;
  label: string;
  to:
    | "/dashboard"
    | "/cases"
    | "/new-request"
    | "/reports"
    | "/audit"
    | "/users"
    | "/master-data"
    | "/rules"
    | "/notifications";
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { key: "cases", label: "Cases", to: "/cases", icon: FolderOpen },
  { key: "new-request", label: "New Request", to: "/new-request", icon: FilePlus2 },
  { key: "reports", label: "Reports", to: "/reports", icon: BarChart3 },
  { key: "audit", label: "Audit", to: "/audit", icon: ScrollText },
  { key: "users", label: "Users", to: "/users", icon: Users },
  { key: "master-data", label: "Master Data", to: "/master-data", icon: Database },
  { key: "rules", label: "Rules & SLAs", to: "/rules", icon: GitBranch },
  { key: "notifications", label: "Notifications", to: "/notifications", icon: Bell },
];

/** The nav items a role may see; decided only by `canSee` (permissions.ts). */
export const navItemsFor = (role: UserRole) => NAV_ITEMS.filter((i) => canSee(role, i.key));

/** Topbar title: the nav item owning the path ("/cases/abc" -> "Cases"). */
export function titleFor(pathname: string): string {
  if (pathname === "/profile") return "Profile";
  const item = NAV_ITEMS.find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
  return item?.label ?? "Legal Case Management";
}
