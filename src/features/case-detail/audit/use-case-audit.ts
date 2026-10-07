import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/lib/api/client";
import type { CaseAuditDto } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";

const PAGE_SIZE = 20;

export function useCaseAudit(caseId: string, page: number) {
  const params = { page, pageSize: PAGE_SIZE };
  return useQuery({
    queryKey: qk.caseAudit(caseId, params),
    queryFn: () =>
      apiJson<CaseAuditDto>(`/cases/${caseId}/audit?page=${page}&pageSize=${PAGE_SIZE}`),
  });
}
