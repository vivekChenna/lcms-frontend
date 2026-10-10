import { Outlet, createFileRoute } from "@tanstack/react-router";
import { NotFoundContent } from "@/components/common/not-found";
import { PageTransition } from "@/components/common/page-transition";
import { AppShell } from "@/components/layout/app-shell";
import { ShellSkeleton } from "@/components/layout/shell-skeleton";
import { requireNav } from "@/lib/guards";

// Pathless layout: every child route needs a session and renders inside the AppShell.
export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context, location }) => ({
    me: await requireNav(context.queryClient, location),
  }),
  component: AuthedLayout,
  // an address under a signed-in page that matches nothing (e.g. /dashboard/123): shown inside the shell
  notFoundComponent: NotFoundContent,
  // On a refresh the session check is a network round trip. Without this the page is blank until it
  // answers; with it the sidebar and top bar are drawn straight away. 100 ms keeps ordinary
  // navigations (session already cached) from flashing it.
  pendingComponent: ShellSkeleton,
  pendingMs: 100,
  pendingMinMs: 300,
});

function AuthedLayout() {
  return (
    <AppShell>
      <PageTransition>
        <Outlet />
      </PageTransition>
    </AppShell>
  );
}
