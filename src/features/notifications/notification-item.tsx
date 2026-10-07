import { useNavigate } from "@tanstack/react-router";
import { formatDateTime } from "@/lib/format";
import { useMarkRead, type NotificationDto } from "./use-notifications";

type Props = { notification: NotificationDto; onNavigate?: () => void };

/** Clicking marks it read (once; a no-op if already read) and navigates to its case, if any. */
export function NotificationItem({ notification, onNavigate }: Props) {
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
      className="flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-muted"
    >
      <span
        aria-hidden
        className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-primary"}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{notification.title}</span>
        <span className="block text-sm text-muted-foreground">{notification.body}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {formatDateTime(notification.createdAt)}
          {notification.relatedCaseReference && ` — ${notification.relatedCaseReference}`}
        </span>
      </span>
    </button>
  );
}
