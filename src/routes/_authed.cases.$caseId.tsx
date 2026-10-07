import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CaseDetailPage } from "@/features/case-detail/case-detail-page";

export const Route = createFileRoute("/_authed/cases/$caseId")({
  validateSearch: z.object({
    tab: z.enum(["overview", "documents", "requests", "comments", "audit"]).catch("overview"),
  }),
  head: () => ({
    meta: [
      { title: "Case Detail | Algihaz LCMS" },
      { name: "description", content: "Review legal case details and workflow history." },
      { property: "og:title", content: "Case Detail | Algihaz LCMS" },
      {
        property: "og:description",
        content: "Review legal case details and workflow history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaseDetailPage,
});
