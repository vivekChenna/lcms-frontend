import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setSessionExpiredHandler } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { sessionExpiredHandler } from "@/lib/guards";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (n, err) => !(err instanceof ApiError && err.status < 500) && n < 2,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // A failed refresh sends the user to /login once, remembering where they were.
  setSessionExpiredHandler(
    sessionExpiredHandler(
      queryClient,
      () => router.latestLocation,
      (redirect) => router.navigate({ to: "/login", search: { redirect }, replace: true }),
    ),
  );

  return router;
};
