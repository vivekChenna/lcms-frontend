import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuditPage } from "@/features/audit/audit-page";
import { requireNav } from "@/lib/guards";

export const Route = createFileRoute("/_authed/audit")({
  validateSearch: z.object({
    page: z.coerce.number().int().min(1).catch(1).default(1),
    actorId: z.string().optional(),
    action: z.string().optional(),
    caseId: z.string().optional(),
    createdFrom: z.string().optional(),
    createdTo: z.string().optional(),
  }),
  beforeLoad: async ({ context, location }) => {
    await requireNav(context.queryClient, location, "audit");
  },
  head: () => ({
    meta: [
      { title: "Audit Log | Algihaz LCMS" },
      { name: "description", content: "Review legal system activity." },
      { property: "og:title", content: "Audit Log | Algihaz LCMS" },
      { property: "og:description", content: "Review legal system activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuditPage,
});
