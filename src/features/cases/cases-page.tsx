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
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useMe } from "@/lib/auth";
import { ResultsRegion } from "@/components/common/results-region";
import { ActiveFilters } from "./active-filters";
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
  const bp = useBreakpoint();
  const wide = bp === "lg" || bp === "xl";
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
        title="Case repository"
        description={
          data
            ? `${data.total} ${data.total === 1 ? "case" : "cases"} — search, filter and export.`
            : "Search, filter and export."
        }
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
      {/* On a phone the search and filters come first (they are what you came to use); from lg up
          the summary leads, as on the dashboard. */}
      <div className="flex flex-col">
        {me && summary.data?.tiles && (
          <div className="order-2 mb-4 space-y-4 lg:order-1">
            <Tiles data={summary.data} role={me.role} compact />
            <StatusChart byStatus={summary.data.byStatus ?? []} />
          </div>
        )}

        <div className="order-1 mb-4 space-y-3 rounded-xl border bg-card p-3 lg:order-2">
          <CaseFilters
            value={search}
            onChange={(patch) => setSearch(patch)}
            onClear={clear}
            loading={isFetching && !isPending}
          />
          <ActiveFilters
            value={search}
            onRemove={(patch) => setSearch(patch)}
            // on a wide screen these four already show as highlighted controls in the toolbar
            exclude={wide ? ["status", "priority", "sla", "search"] : []}
          />
        </div>
      </div>

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {/* the tiles and chart link here (#results), so a click lands on the list, not the top */}
      {/* min height: even a one-row list leaves enough page below to scroll the list to the top */}
      <div id="results" className="min-h-[70vh] scroll-mt-4">
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
    </div>
  );
}
