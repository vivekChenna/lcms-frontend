import { useNavigate, useSearch } from "@tanstack/react-router";
import { Download } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
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

function ReportCard({
  name,
  filters,
  children,
}: {
  name: string;
  filters: ReportsSearch;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex justify-end">
        <ExportButton name={name} filters={filters} />
      </div>
      {children}
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
          <ReportCard name="sla-compliance" filters={search}>
            {sla.isPending && null}
            {sla.isError && <ErrorState error={sla.error} onRetry={() => void sla.refetch()} />}
            {sla.data && <SlaComplianceChart data={sla.data} />}
          </ReportCard>
        </TabsContent>
        <TabsContent value="ageing">
          <ReportCard name="ageing" filters={search}>
            {ageing.isPending && null}
            {ageing.isError && (
              <ErrorState error={ageing.error} onRetry={() => void ageing.refetch()} />
            )}
            {ageing.data && <AgeingChart data={ageing.data} />}
          </ReportCard>
        </TabsContent>
        <TabsContent value="volume-by-category">
          <ReportCard name="volume-by-category" filters={search}>
            {volumeByCategory.isPending && null}
            {volumeByCategory.isError && (
              <ErrorState
                error={volumeByCategory.error}
                onRetry={() => void volumeByCategory.refetch()}
              />
            )}
            {volumeByCategory.data && <VolumeByCategoryChart data={volumeByCategory.data} />}
          </ReportCard>
        </TabsContent>
        <TabsContent value="volume-by-organisation">
          <ReportCard name="volume-by-organisation" filters={search}>
            {volumeByOrganisation.isPending && null}
            {volumeByOrganisation.isError && (
              <ErrorState
                error={volumeByOrganisation.error}
                onRetry={() => void volumeByOrganisation.refetch()}
              />
            )}
            {volumeByOrganisation.data && (
              <VolumeByOrganisationChart data={volumeByOrganisation.data} />
            )}
          </ReportCard>
        </TabsContent>
        <TabsContent value="rep-workload">
          <ReportCard name="rep-workload" filters={search}>
            {repWorkload.isPending && null}
            {repWorkload.isError && (
              <ErrorState error={repWorkload.error} onRetry={() => void repWorkload.refetch()} />
            )}
            {repWorkload.data && <RepWorkloadChart data={repWorkload.data} />}
          </ReportCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
