import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { NotificationsPage } from "@/features/notifications/notifications-page";

export const Route = createFileRoute("/_authed/notifications")({
  validateSearch: z.object({
    filter: z.enum(["all", "unread"]).catch("all"),
    page: z.coerce.number().int().min(1).catch(1).default(1),
  }),
  head: () => ({
    meta: [
      { title: "Notifications | Algihaz LCMS" },
      { name: "description", content: "Legal workflow notifications." },
      { property: "og:title", content: "Notifications | Algihaz LCMS" },
      { property: "og:description", content: "Legal workflow notifications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});
