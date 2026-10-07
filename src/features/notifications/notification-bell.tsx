import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationItem } from "./notification-item";
import { useLatestNotifications, useUnreadCount } from "./use-notifications";

function badgeLabel(count: number): string {
  return count > 99 ? "99+" : String(count);
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount } = useUnreadCount();
  const latest = useLatestNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
          title="Notifications"
          className="relative grid size-11 shrink-0 place-items-center rounded-md hover:bg-muted lg:size-9"
        >
          <Bell className="size-5" />
          {!!unreadCount && unreadCount > 0 && (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-medium leading-4 text-danger-foreground">
              {badgeLabel(unreadCount)}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <p className="px-2 py-1 text-sm font-medium">Notifications</p>
        {latest.data && latest.data.items.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
        )}
        {latest.data && latest.data.items.length > 0 && (
          <div className="space-y-1">
            {latest.data.items.map((n) => (
              <NotificationItem key={n.id} notification={n} onNavigate={() => setOpen(false)} />
            ))}
          </div>
        )}
        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="mt-1 block rounded-md p-2 text-center text-sm text-primary hover:bg-muted"
        >
          View all
        </Link>
      </PopoverContent>
    </Popover>
  );
}
