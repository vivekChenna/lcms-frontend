import type { UseQueryResult } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Download } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { ResultsRegion } from "@/components/common/results-region";
import { ChartSkeleton } from "@/components/common/skeletons";
import { AgeingChart } from "./charts/ageing-chart";
import { RepWorkloadChart } from "./charts/rep-workload-chart";
import { SlaComplianceChart } from "./charts/sla-compliance-chart";
import { VolumeByCategoryChart } from "./charts/volume-by-category-chart";
import { VolumeByOrganisationChart } from "./charts/volume-by-organisation-chart";
import { ReportFilters } from "./report-filters";
import type { ReportsSearch } from "./search-params";
import {
  useAgeing,
  useExportReport,
  useRepWorkload,
  useSlaCompliance,
  useVolumeByCategory,
  useVolumeByOrganisation,
} from "./use-reports";

const REPORTS = [
  { key: "sla-compliance", label: "SLA compliance" },
  { key: "ageing", label: "Ageing" },
  { key: "volume-by-category", label: "Volume by category" },
  { key: "volume-by-organisation", label: "Volume by organisation" },
  { key: "rep-workload", label: "Rep workload" },
] as const;

function ExportButton({ name, filters }: { name: string; filters: ReportsSearch }) {
  const exportReport = useExportReport(name, filters);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={exportReport.isPending}
      onClick={() => exportReport.mutate()}
    >
      <Download />
      Export CSV
    </Button>
  );
}

/** One report: export button, a spinner on first load, "Updating" while filters re-run it, errors. */
function ReportCard<T>({
  name,
  label,
  filters,
  query,
  render,
}: {
  name: string;
  label: string;
  filters: ReportsSearch;
  query: UseQueryResult<T, Error>;
  render: (data: T) => ReactNode;
}) {
  // `isLoading` (not `isPending`): a report whose date range is invalid is disabled, not loading
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex justify-end">
        <ExportButton name={name} filters={filters} />
      </div>
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      <ResultsRegion
        label={label}
        initialLoading={query.isLoading}
        skeleton={
          <div className="space-y-4">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        }
        fetching={query.isFetching && !query.isLoading}
      >
        {query.data && render(query.data)}
      </ResultsRegion>
    </div>
  );
}

export function ReportsPage() {
  const search = useSearch({ strict: false }) as ReportsSearch;
  const navigate = useNavigate();

  const setSearch = (patch: Partial<ReportsSearch>) =>
    void navigate({ to: ".", search: ((prev: ReportsSearch) => ({ ...prev, ...patch })) as never });
  const clear = () => void navigate({ to: ".", search: {} as never });

  const sla = useSlaCompliance(search);
  const ageing = useAgeing(search);
  const volumeByCategory = useVolumeByCategory(search);
  const volumeByOrganisation = useVolumeByOrganisation(search);
  const repWorkload = useRepWorkload(search);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="SLA compliance, caseload and workload across the legal team."
      />
      <ReportFilters value={search} onChange={setSearch} onClear={clear} />

      <Tabs defaultValue="sla-compliance" className="mt-4">
        <TabsList>
          {REPORTS.map((r) => (
            <TabsTrigger key={r.key} value={r.key}>
              {r.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="sla-compliance">
          <ReportCard
            name="sla-compliance"
            label="SLA compliance"
            filters={search}
            query={sla}
            render={(data) => <SlaComplianceChart data={data} />}
          />
        </TabsContent>
        <TabsContent value="ageing">
          <ReportCard
            name="ageing"
            label="ageing"
            filters={search}
            query={ageing}
            render={(data) => <AgeingChart data={data} />}
          />
        </TabsContent>
        <TabsContent value="volume-by-category">
          <ReportCard
            name="volume-by-category"
            label="volume by category"
            filters={search}
            query={volumeByCategory}
            render={(data) => <VolumeByCategoryChart data={data} />}
          />
        </TabsContent>
        <TabsContent value="volume-by-organisation">
          <ReportCard
            name="volume-by-organisation"
            label="volume by organisation"
            filters={search}
            query={volumeByOrganisation}
            render={(data) => <VolumeByOrganisationChart data={data} />}
          />
        </TabsContent>
        <TabsContent value="rep-workload">
          <ReportCard
            name="rep-workload"
            label="rep workload"
            filters={search}
            query={repWorkload}
            render={(data) => <RepWorkloadChart data={data} />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
