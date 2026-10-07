import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api/client";
import type { DashboardDto } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";

export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: () => apiJson<DashboardDto>("/dashboard"),
  });
}

/** Build the `/cases` search params the backend gives for a dashboard tile's "filters" entry. */
export function casesSearch(filters: Record<string, string> | undefined) {
  return { ...filters };
}
