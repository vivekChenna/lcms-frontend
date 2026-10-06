import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { requireNav } from "@/lib/guards";
import { LcmsProvider } from "@/lib/lcms-context";

// Pathless layout: every child route needs a session and renders inside the AppShell. Until
// their screens are rebuilt, the legacy LcmsApp page bodies read their role from LcmsProvider.
export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context, location }) => ({
    me: await requireNav(context.queryClient, location),
  }),
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <LcmsProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </LcmsProvider>
  );
}
