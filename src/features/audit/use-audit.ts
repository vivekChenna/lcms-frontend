import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDownload, apiJson } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import { qs } from "@/lib/api/qs";
import type { AuditListDto } from "@/lib/api/types";
import { endOfDayISO, startOfDayISO } from "@/lib/format";
import { qk } from "@/lib/queries/keys";

export type AuditFilters = {
  actorId?: string | undefined;
  action?: string | undefined;
  caseId?: string | undefined;
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
};

export function dateRangeInvalid(filters: AuditFilters): boolean {
  if (!filters.createdFrom || !filters.createdTo) return false;
  return filters.createdFrom > filters.createdTo;
}

function queryParams(filters: AuditFilters) {
  const { createdFrom, createdTo, ...rest } = filters;
  return {
    ...rest,
    createdFrom: createdFrom ? startOfDayISO(createdFrom) : undefined,
    createdTo: createdTo ? endOfDayISO(createdTo) : undefined,
  };
}

const PAGE_SIZE = 20;

export function useAudit(filters: AuditFilters, page: number) {
  const params = { ...queryParams(filters), page, pageSize: PAGE_SIZE };
  return useQuery({
    queryKey: qk.audit(params),
    queryFn: () => apiJson<AuditListDto>(`/audit${qs(params)}`),
    placeholderData: keepPreviousData,
    enabled: !dateRangeInvalid(filters),
  });
}

export function useExportAudit(filters: AuditFilters) {
  return useMutation<{ total?: number; truncated: boolean }, ApiError, void>({
    mutationFn: () => apiDownload(`/audit/export${qs(queryParams(filters))}`, "audit.csv"),
    onSuccess: ({ total, truncated }) => {
      if (truncated) {
        toast.warning("Export limited to the first 10,000 rows");
      } else {
        toast.success(
          total !== undefined
            ? `Exported ${total} row${total === 1 ? "" : "s"}`
            : "Export complete",
        );
      }
    },
    onError: (err) => toast.error(err.message),
  });
}
