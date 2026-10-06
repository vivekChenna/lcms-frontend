import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireNav } from "@/lib/guards";
import { LcmsProvider } from "@/lib/lcms-context";

// Pathless layout: every child route needs a session. The AppShell replaces this in B5;
// until then the legacy LcmsApp pages read their role from LcmsProvider (fed by /auth/me).
export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context, location }) => ({
    me: await requireNav(context.queryClient, location),
  }),
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <LcmsProvider>
      <Outlet />
    </LcmsProvider>
  );
}
