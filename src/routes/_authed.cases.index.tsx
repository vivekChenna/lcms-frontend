import { createFileRoute } from "@tanstack/react-router";
import { casesSearchSchema } from "@/features/cases/search-params";
import { CasesPage } from "@/features/cases/cases-page";

export const Route = createFileRoute("/_authed/cases/")({
  validateSearch: casesSearchSchema,
  head: () => ({
    meta: [
      { title: "Case Repository | Algihaz LCMS" },
      { name: "description", content: "Search and filter legal cases." },
      { property: "og:title", content: "Case Repository | Algihaz LCMS" },
      { property: "og:description", content: "Search and filter legal cases." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CasesPage,
});
