import { createFileRoute } from "@tanstack/react-router";
import { RulesPage } from "@/features/rules/rules-page";
import { requireNav } from "@/lib/guards";

export const Route = createFileRoute("/_authed/rules")({
  beforeLoad: async ({ context, location }) => {
    await requireNav(context.queryClient, location, "rules");
  },
  head: () => ({
    meta: [
      { title: "Rules and SLAs | Algihaz LCMS" },
      { name: "description", content: "Review legal routing and SLA rules." },
      { property: "og:title", content: "Rules and SLAs | Algihaz LCMS" },
      { property: "og:description", content: "Review legal routing and SLA rules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RulesPage,
});
