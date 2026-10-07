import { createFileRoute } from "@tanstack/react-router";
import { MasterDataPage } from "@/features/master-data/master-data-page";
import { requireNav } from "@/lib/guards";

export const Route = createFileRoute("/_authed/master-data")({
  beforeLoad: async ({ context, location }) => {
    await requireNav(context.queryClient, location, "master-data");
  },
  head: () => ({
    meta: [
      { title: "Master Data | Algihaz LCMS" },
      { name: "description", content: "Manage legal case reference data." },
      { property: "og:title", content: "Master Data | Algihaz LCMS" },
      { property: "og:description", content: "Manage legal case reference data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MasterDataPage,
});
