import { useIsFetching } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useSplashGate } from "@/hooks/use-splash-gate";

/**
 * Renders nothing; keeps the splash screen up until the page and its data have loaded, then lets
 * it fade away. Background polling (notifications) is ignored: it fires every few seconds and
 * would otherwise keep the splash up for no reason.
 */
export function SplashGate() {
  const fetching = useIsFetching({ predicate: (q) => q.queryKey[0] !== "notifications" });
  const navigating = useRouterState({ select: (s) => s.isLoading || s.status === "pending" });
  useSplashGate(fetching > 0 || navigating);
  return null;
}
