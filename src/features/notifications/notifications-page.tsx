import { useNavigate, useSearch } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { NotificationItem } from "./notification-item";
import { useMarkAllRead, useNotifications } from "./use-notifications";

type Filter = "all" | "unread";
type Search = { filter?: Filter; page?: number };

export function NotificationsPage() {
  const search = useSearch({ strict: false }) as Search;
  const navigate = useNavigate();
  const markAllRead = useMarkAllRead();

  const filter = search.filter ?? "all";
  const page = search.page ?? 1;
  const { data, isPending, isError, error, refetch } = useNotifications({
    page,
    isRead: filter === "unread" ? false : undefined,
  });

  const setFilter = (next: Filter) =>
    void navigate({ to: ".", search: { filter: next, page: 1 } as never });
  const setPage = (next: number) =>
    void navigate({ to: ".", search: { ...search, page: next } as never });

  return (
    <div>
      <PageHeader
        title="Notifications"
        actions={
          !!data?.unreadCount &&
          data.unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all as read
            </Button>
          )
        }
      />

      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          type="button"
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          Unread
        </Button>
      </div>

      {isPending && null}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}
      {data && data.items.length === 0 && (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      )}
      {data && data.items.length > 0 && (
        <div>
          <div className="space-y-1 rounded-lg border bg-card p-2">
            {data.items.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
