import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDownload, apiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { qs } from "@/lib/api/qs";
import type { CaseListDto } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";
import type { CasesSearch } from "./search-params";

export function useCases(filters: CasesSearch) {
  return useQuery({
    queryKey: qk.cases(filters),
    queryFn: () => apiJson<CaseListDto>(`/cases${qs(filters)}`),
    placeholderData: keepPreviousData,
  });
}

/** The export endpoint has no pagination; replay every other filter. */
function withoutPaging({ page: _page, pageSize: _pageSize, ...rest }: CasesSearch) {
  return rest;
}

export function useExportCases(filters: CasesSearch) {
  return useMutation<{ total?: number; truncated: boolean }, ApiError, void>({
    mutationFn: () => apiDownload(`/cases/export${qs(withoutPaging(filters))}`, "cases.csv"),
    onSuccess: ({ total, truncated }) => {
      if (truncated) {
        toast.warning("Export limited to the first 10,000 cases");
      } else {
        toast.success(total !== undefined ? `Exported ${total} cases` : "Export complete");
      }
    },
    onError: (err) => toast.error(err.message),
  });
}
