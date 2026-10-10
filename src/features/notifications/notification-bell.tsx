import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { qk } from "@/lib/queries/keys";
import { NotificationItem } from "./notification-item";
import { useLatestNotifications, useUnreadCount } from "./use-notifications";

function badgeLabel(count: number): string {
  return count > 99 ? "99+" : String(count);
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount } = useUnreadCount();
  const latest = useLatestNotifications();
  const qc = useQueryClient();

  // Ring the bell when the unread count goes UP. The count the page first loads with is not news,
  // and a drop (something was read) is not either.
  const previous = useRef<number | undefined>(undefined);
  const [ringing, setRinging] = useState(false);
  useEffect(() => {
    if (unreadCount === undefined) return;
    const before = previous.current;
    previous.current = unreadCount;
    if (before === undefined || unreadCount <= before) return;
    setRinging(true);
    // A new notification means something changed: refresh the popup list, and the dashboard and case
    // lists behind it, so the screen does not keep showing the state from before.
    void qc.invalidateQueries({
      queryKey: qk.notifications({ page: 1, pageSize: 5, latest: true }),
    });
    void qc.invalidateQueries({ queryKey: qk.dashboard });
    void qc.invalidateQueries({ queryKey: ["cases"] });
    const stop = setTimeout(() => setRinging(false), 1600);
    return () => clearTimeout(stop);
  }, [unreadCount, qc]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
          title="Notifications"
          data-ringing={ringing}
          className="relative grid size-11 shrink-0 place-items-center rounded-md hover:bg-muted lg:size-9"
        >
          <motion.span
            className="grid origin-top place-items-center"
            animate={ringing ? { rotate: [0, -16, 14, -10, 8, -4, 0] } : { rotate: 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          >
            <Bell className={ringing ? "size-5 text-primary" : "size-5"} />
          </motion.span>
          {!!unreadCount && unreadCount > 0 && (
            // keyed by the count, so the badge pops each time the number changes
            <motion.span
              key={unreadCount}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-medium leading-4 text-danger-foreground"
            >
              {badgeLabel(unreadCount)}
            </motion.span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[min(32rem,80vh)] w-80 overflow-y-auto p-2">
        <p className="px-2 py-1 text-sm font-medium">Notifications</p>
        {latest.data && latest.data.items.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
        )}
        {latest.data && latest.data.items.length > 0 && (
          <div className="space-y-1">
            {latest.data.items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                compact
                onNavigate={() => setOpen(false)}
              />
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
