import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { requireNav } from "@/lib/guards";

// Pathless layout: every child route needs a session and renders inside the AppShell.
export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context, location }) => ({
    me: await requireNav(context.queryClient, location),
  }),
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
