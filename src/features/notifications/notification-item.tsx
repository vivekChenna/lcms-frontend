import { useNavigate } from "@tanstack/react-router";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMarkRead, type NotificationDto } from "./use-notifications";

type Props = {
  notification: NotificationDto;
  onNavigate?: () => void;
  /** The bell's popover: title and time only. The full wording stays on the Notifications page. */
  compact?: boolean;
};

/** Clicking marks it read (once; a no-op if already read) and navigates to its case, if any. */
export function NotificationItem({ notification, onNavigate, compact }: Props) {
  const markRead = useMarkRead();
  const navigate = useNavigate();

  const open = () => {
    if (!notification.isRead) markRead.mutate(notification.id);
    onNavigate?.();
    if (notification.relatedCaseId) {
      void navigate({ to: "/cases/$caseId", params: { caseId: notification.relatedCaseId } });
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-muted",
        !notification.isRead && "bg-primary/5",
      )}
    >
      <span
        aria-hidden
        className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-primary"}`}
      />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm",
            notification.isRead ? "font-normal" : "font-medium",
            compact && "line-clamp-2",
          )}
        >
          {notification.title}
        </span>
        {!compact && (
          <span className="block text-sm text-muted-foreground">{notification.body}</span>
        )}
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {formatDateTime(notification.createdAt)}
          {!compact &&
            notification.relatedCaseReference &&
            ` — ${notification.relatedCaseReference}`}
        </span>
      </span>
    </button>
  );
}
