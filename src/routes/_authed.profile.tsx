import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/features/profile/profile-page";

export const Route = createFileRoute("/_authed/profile")({
  head: () => ({
    meta: [
      { title: "Profile | Algihaz LCMS" },
      { name: "description", content: "Your account details and password." },
      { property: "og:title", content: "Profile | Algihaz LCMS" },
      { property: "og:description", content: "Your account details and password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});
