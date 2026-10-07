import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDownload, apiJson } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import { qs } from "@/lib/api/qs";
import type {
  AgeingReportDto,
  RepWorkloadReportDto,
  SlaComplianceReportDto,
  VolumeByCategoryReportDto,
  VolumeByOrganisationReportDto,
} from "@/lib/api/types";
import { endOfDayISO, startOfDayISO } from "@/lib/format";
import { qk } from "@/lib/queries/keys";
import type { ReportsSearch } from "./search-params";

export function dateRangeInvalid(filters: ReportsSearch): boolean {
  if (!filters.createdFrom || !filters.createdTo) return false;
  return filters.createdFrom > filters.createdTo;
}

function queryParams(filters: ReportsSearch) {
  const { createdFrom, createdTo, ...rest } = filters;
  return {
    ...rest,
    createdFrom: createdFrom ? startOfDayISO(createdFrom) : undefined,
    createdTo: createdTo ? endOfDayISO(createdTo) : undefined,
  };
}

function useReport<T>(name: string, filters: ReportsSearch) {
  const enabled = !dateRangeInvalid(filters);
  return useQuery({
    queryKey: qk.reports(name, filters),
    queryFn: () => apiJson<T>(`/reports/${name}${qs(queryParams(filters))}`),
    enabled,
  });
}

export const useSlaCompliance = (filters: ReportsSearch) =>
  useReport<SlaComplianceReportDto>("sla-compliance", filters);
export const useAgeing = (filters: ReportsSearch) => useReport<AgeingReportDto>("ageing", filters);
export const useVolumeByCategory = (filters: ReportsSearch) =>
  useReport<VolumeByCategoryReportDto>("volume-by-category", filters);
export const useVolumeByOrganisation = (filters: ReportsSearch) =>
  useReport<VolumeByOrganisationReportDto>("volume-by-organisation", filters);
export const useRepWorkload = (filters: ReportsSearch) =>
  useReport<RepWorkloadReportDto>("rep-workload", filters);

const EXPORT_LABEL: Record<string, string> = {
  "sla-compliance": "SLA compliance",
  ageing: "ageing",
  "volume-by-category": "volume by category",
  "volume-by-organisation": "volume by organisation",
  "rep-workload": "rep workload",
};

export function useExportReport(name: string, filters: ReportsSearch) {
  return useMutation<{ total?: number; truncated: boolean }, ApiError, void>({
    mutationFn: () =>
      apiDownload(`/reports/${name}/export${qs(queryParams(filters))}`, `${name}.csv`),
    onSuccess: ({ total, truncated }) => {
      if (truncated) {
        toast.warning("Export limited to the first 10,000 rows");
      } else {
        toast.success(
          total !== undefined
            ? `Exported ${total} row${total === 1 ? "" : "s"}`
            : `Exported ${EXPORT_LABEL[name] ?? name}`,
        );
      }
    },
    onError: (err) => toast.error(err.message),
  });
}
