import { FolderOpen } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { StatusChart } from "@/features/dashboard/status-chart";
import { Tiles } from "@/features/dashboard/tiles";
import { useDashboard } from "@/features/dashboard/use-dashboard";
import { useMe } from "@/lib/auth";
import { ResultsRegion } from "@/components/common/results-region";
import { CaseFilters } from "./case-filters";
import { CasesTable } from "./cases-table";
import { useCases, useExportCases } from "./use-cases";
import type { CasesSearch } from "./search-params";

export function CasesPage() {
  const search = useSearch({ strict: false }) as CasesSearch;
  const navigate = useNavigate();
  const { data, isPending, isFetching, isError, error, refetch } = useCases(search);
  const exportCases = useExportCases(search);
  const me = useMe();
  const summary = useDashboard();

  // `useSearch`/`useNavigate` are untyped without a `from`, which this reusable component (also
  // rendered under a plain test router) does not hard-code; the route's own `validateSearch`
  // (casesSearchSchema) is the real type guarantee.
  const setSearch = (patch: Partial<CasesSearch>, resetPage = true) =>
    void navigate({
      to: ".",
      search: ((prev: CasesSearch) => ({
        ...prev,
        ...patch,
        ...(resetPage ? { page: 1 } : {}),
      })) as never,
    });

  const clear = () =>
    void navigate({ to: ".", search: { page: 1, pageSize: search.pageSize } as never });

  return (
    <div>
      <PageHeader
        title="Cases"
        description="Search, filter and export the case repository."
        actions={
          <Button
            type="button"
            variant="outline"
            disabled={exportCases.isPending}
            onClick={() => exportCases.mutate()}
          >
            Export CSV
          </Button>
        }
      />

      {/* BRD UI-08: the dashboard's tiles and status chart, acting as filters for this list. If the
          summary fails to load the list still works, so its error is not shown here. */}
      {me && summary.data?.tiles && (
        <div className="mb-4 space-y-4">
          <Tiles data={summary.data} role={me.role} />
          <StatusChart byStatus={summary.data.byStatus ?? []} />
        </div>
      )}

      <div className="mb-4">
        <CaseFilters
          value={search}
          onChange={(patch) => setSearch(patch)}
          onClear={clear}
          loading={isFetching && !isPending}
        />
      </div>

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      <ResultsRegion label="cases" initialLoading={isPending} fetching={isFetching && !isPending}>
        {data && (
          <div className="space-y-4">
            <CasesTable
              rows={data.items}
              empty={
                <EmptyState
                  icon={FolderOpen}
                  title="No cases match these filters"
                  action={
                    <Button type="button" variant="outline" onClick={clear}>
                      Clear filters
                    </Button>
                  }
                />
              }
            />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={(page) => setSearch({ page }, false)}
            />
          </div>
        )}
      </ResultsRegion>
    </div>
  );
}
