import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { setSessionExpiredHandler } from "@/lib/api/client";
import { ApiError, isNetworkError } from "@/lib/api/errors";
import { sessionExpiredHandler } from "@/lib/guards";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    // Every other 4xx/5xx is an ApiError a screen already turns into its own ErrorState/toast;
    // only a genuine network failure (offline, unreachable server) has nowhere else to surface,
    // so it gets one global toast here. A stable id lets repeated background-refetch failures
    // during the same outage update one toast instead of stacking new ones.
    queryCache: new QueryCache({
      onError: (error) => {
        if (isNetworkError(error)) {
          toast.error("Can't reach the server", { id: "network-error" });
        }
      },
    }),
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
