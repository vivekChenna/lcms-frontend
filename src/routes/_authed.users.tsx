import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { UsersPage } from "@/features/users/users-page";
import { requireNav } from "@/lib/guards";

const ROLE_NAMES = ["admin", "legal_manager", "legal_rep", "requester", "viewer"] as const;

export const Route = createFileRoute("/_authed/users")({
  validateSearch: z.object({
    search: z.string().optional(),
    role: z.enum(ROLE_NAMES).optional().catch(undefined),
    isActive: z.boolean().optional(),
    page: z.coerce.number().int().min(1).catch(1).default(1),
  }),
  beforeLoad: async ({ context, location }) => {
    await requireNav(context.queryClient, location, "users");
  },
  head: () => ({
    meta: [
      { title: "Users | Algihaz LCMS" },
      { name: "description", content: "Manage LCMS users and roles." },
      { property: "og:title", content: "Users | Algihaz LCMS" },
      { property: "og:description", content: "Manage LCMS users and roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});
