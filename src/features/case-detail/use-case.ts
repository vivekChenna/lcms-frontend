import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { CaseDto } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";

/** A single case by id; never retries a 404/403 (same case either way, no point retrying). */
export function useCase(id: string) {
  return useQuery({
    queryKey: qk.case(id),
    queryFn: () => apiJson<CaseDto>(`/cases/${id}`),
    retry: (n, e) => !(e instanceof ApiError) && n < 2,
  });
}
