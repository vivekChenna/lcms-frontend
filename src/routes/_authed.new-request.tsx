import { createFileRoute } from "@tanstack/react-router";
import { NewRequestPage } from "@/features/new-request/new-request-page";
import { requireNav } from "@/lib/guards";
export const Route = createFileRoute("/_authed/new-request")({
  beforeLoad: async ({ context, location }) => {
    await requireNav(context.queryClient, location, "new-request");
  },
  head: () => ({
    meta: [
      { title: "New Legal Request | Algihaz LCMS" },
      { name: "description", content: "Submit a legal request for review." },
      { property: "og:title", content: "New Legal Request | Algihaz LCMS" },
      { property: "og:description", content: "Submit a legal request for review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewRequestPage,
});
