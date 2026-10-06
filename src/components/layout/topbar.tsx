import { Link } from "@tanstack/react-router";
import { Bell, Menu } from "lucide-react";
import type { Profile } from "@/lib/api/types";
import { UserMenu } from "./user-menu";

type Props = { title: string; me: Profile; onOpenNav: () => void };

/**
 * Never overflows: the title truncates; everything else is fixed-size. Safe areas: top inset
 * always; left/right below md; from md only the right one (the rail beside it takes the left).
 */
export function Topbar({ title, me, onOpenNav }: Props) {
  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-1 border-b bg-background/95 pt-[env(safe-area-inset-top)] pr-[max(0.5rem,env(safe-area-inset-right))] pl-[max(0.5rem,env(safe-area-inset-left))] backdrop-blur md:gap-2 md:pr-[max(1.5rem,env(safe-area-inset-right))] md:pl-6">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onOpenNav}
        className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-muted lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      <span
        data-testid="topbar-title"
        title={title}
        className="min-w-0 flex-1 truncate px-1 text-base font-semibold md:text-lg"
      >
        {title}
      </span>
      {/* The unread count is wired in B16. */}
      <Link
        to="/notifications"
        aria-label="Open notifications"
        title="Notifications"
        className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-muted lg:size-9"
      >
        <Bell className="size-5" />
      </Link>
      <UserMenu me={me} />
    </header>
  );
}
