import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/dashboard-page";

// The dashboard is the landing page after sign-in, at /dashboard. There is no separate home page:
// the bare address "/" just forwards here (see routes/index.tsx).
export const Route = createFileRoute("/_authed/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Algihaz LCMS" },
      { name: "description", content: "Legal caseload and SLA overview." },
      { property: "og:title", content: "Dashboard | Algihaz LCMS" },
      { property: "og:description", content: "Legal caseload and SLA overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});
