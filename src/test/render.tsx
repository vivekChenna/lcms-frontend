import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Profile, UserRole } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";

const NAMES: Record<UserRole, string> = {
  admin: "Ada Admin",
  legal_manager: "Mia Manager",
  legal_rep: "Rex Rep",
  requester: "Ria Requester",
  viewer: "Vik Viewer",
};

/** A full Profile with sensible defaults for the role (default requester); override any field. */
export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  const role = overrides.role ?? "requester";
  return {
    id: `u-${role}`,
    fullName: NAMES[role],
    email: `${role.replace("_", ".")}@example.com`,
    designation: null,
    role,
    departmentId: null,
    departmentName: null,
    entityId: null,
    entityName: null,
    businessUnitId: null,
    businessUnitName: null,
    ...overrides,
  };
}

/**
 * Renders `ui` with a fresh QueryClient (no retries, never garbage collected) and a throwaway
 * memory-history router at `route`, so `Link` and `useNavigate` work. Pass `me` to seed the
 * `['me']` session query; omit it for a signed-out cache.
 */
export function renderWithProviders(
  ui: ReactNode,
  { me, route = "/" }: { me?: Profile; route?: string } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  if (me) queryClient.setQueryData(qk.me, me);
  const rootRoute = createRootRoute({
    component: () => (
      <>
        {ui}
        <Outlet />
      </>
    ),
  });
  const index = createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => null });
  const rest = createRoute({ getParentRoute: () => rootRoute, path: "$", component: () => null });
  const router = createRouter({
    routeTree: rootRoute.addChildren([index, rest]),
    history: createMemoryHistory({ initialEntries: [route] }),
  });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
  return { ...result, router, queryClient };
}
