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

// Test helper: renders `ui` inside a throwaway router (so `Link` works) at `path`.
export function renderWithRouter(
  ui: ReactNode,
  {
    path = "/",
    queryClient = new QueryClient(),
  }: { path?: string; queryClient?: QueryClient } = {},
) {
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
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
  return { ...result, router, queryClient };
}
