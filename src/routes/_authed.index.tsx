import { createFileRoute } from "@tanstack/react-router";
import { LcmsApp } from "@/components/lcms-app";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/_authed/")({
  head: () => ({ meta: [{ title: "Dashboard | Algihaz LCMS" }, { name: "description", content: "Legal caseload and SLA overview." }, { property: "og:title", content: "Dashboard | Algihaz LCMS" }, { property: "og:description", content: "Legal caseload and SLA overview." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <LcmsApp page="dashboard" />;
}
