import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import type { NotificationListDto } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";

export type NotificationDto = NotificationListDto["items"][number];

const NOTIFICATIONS_PREFIX = ["notifications"];

export function useNotifications(filters: {
  isRead?: boolean | undefined;
  page: number;
  pageSize?: number | undefined;
}) {
  const params = { page: filters.page, pageSize: filters.pageSize ?? 20, isRead: filters.isRead };
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("pageSize", String(params.pageSize));
  if (params.isRead !== undefined) qs.set("isRead", String(params.isRead));
  return useQuery({
    queryKey: qk.notifications(params),
    queryFn: () => apiJson<NotificationListDto>(`/notifications?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });
}

/** The lightweight query the bell polls: `unreadCount` comes back on every /notifications
 * response regardless of page size, so one item is enough. */
export function useUnreadCount() {
  return useQuery({
    queryKey: qk.notifications({ page: 1, pageSize: 1, badge: true }),
    queryFn: () => apiJson<NotificationListDto>("/notifications?page=1&pageSize=1"),
    select: (data) => data.unreadCount,
    // short enough that a new notification shows up while someone is still looking at the screen
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

/** The latest 5, for the bell's popover. */
export function useLatestNotifications() {
  return useQuery({
    queryKey: qk.notifications({ page: 1, pageSize: 5, latest: true }),
    queryFn: () => apiJson<NotificationListDto>("/notifications?page=1&pageSize=5"),
  });
}

type Snapshot = [readonly unknown[], unknown][];

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation<NotificationDto, ApiError, string, { previous: Snapshot }>({
    mutationFn: (id: string) =>
      apiJson<NotificationDto>(`/notifications/${id}/read`, { method: "PATCH" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_PREFIX });
      const previous = qc.getQueriesData<NotificationListDto>({ queryKey: NOTIFICATIONS_PREFIX });
      qc.setQueriesData<NotificationListDto>({ queryKey: NOTIFICATIONS_PREFIX }, (old) => {
        if (!old) return old;
        const target = old.items.find((n) => n.id === id);
        if (!target || target.isRead) return old;
        return {
          ...old,
          items: old.items.map((n) =>
            n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
          ),
          unreadCount: Math.max(0, old.unreadCount - 1),
        };
      });
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: NOTIFICATIONS_PREFIX }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation<{ updated: number }, ApiError, void>({
    mutationFn: () =>
      apiJson<{ updated: number }>("/notifications/read-all", { method: "PATCH", json: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_PREFIX }),
  });
}
