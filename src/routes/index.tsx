import { createFileRoute, redirect } from "@tanstack/react-router";

// There is no home page: the bare address sends people to the dashboard. A signed-out visitor
// continues to the sign-in page from there, and comes back to the dashboard after signing in.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard", replace: true });
  },
});
