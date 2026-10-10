import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { ResponsiveTable, type Column } from "@/components/common/responsive-table";
import { ResultsRegion } from "@/components/common/results-region";
import { ListSkeleton } from "@/components/common/skeletons";
import { Eye, History } from "lucide-react";
import { describe, type AuditRow } from "@/features/case-detail/audit/describe";
import { formatDateTime } from "@/lib/format";
import { roleLabel } from "@/lib/labels";
import { AuditDetails } from "./audit-details";
import { AuditFiltersBar } from "./audit-filters";
import { useAudit, useExportAudit, type AuditFilters } from "./use-audit";

/** describe() returns the raw action string when it doesn't recognise the action (user/master-data
 * actions, none of which it covers); fall back to a generic "Changed <entity>" from the prefix. */
function summaryFor(row: AuditRow): string {
  const described = describe(row);
  if (described !== row.action) return described;
  const [entity] = row.action.split(".");
  return entity ? `Changed ${entity.replace(/_/g, " ")}` : row.action;
}

type Search = AuditFilters & { page?: number };

export function AuditPage() {
  const search = useSearch({ strict: false }) as Search;
  const navigate = useNavigate();
  const [detailsRow, setDetailsRow] = useState<AuditRow | null>(null);

  const page = search.page ?? 1;
  const filters: AuditFilters = {
    actorId: search.actorId,
    action: search.action,
    caseId: search.caseId,
    createdFrom: search.createdFrom,
    createdTo: search.createdTo,
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useAudit(filters, page);
  const exportAudit = useExportAudit(filters);

  const setFilters = (patch: Partial<AuditFilters>) =>
    void navigate({ to: ".", search: { ...search, ...patch, page: 1 } as never });
  const clear = () => void navigate({ to: ".", search: {} as never });
  const setPage = (next: number) =>
    void navigate({ to: ".", search: { ...search, page: next } as never });

  const columns: Column<AuditRow>[] = [
    { key: "time", header: "Time", cell: (r) => formatDateTime(r.createdAt) },
    {
      key: "actor",
      header: "Actor",
      cell: (r) => (
        <>
          <p>{r.actorName ?? "—"}</p>
          {r.actorRole && <p className="text-xs text-muted-foreground">{roleLabel(r.actorRole)}</p>}
        </>
      ),
    },
    { key: "action", header: "Action", cell: (r) => r.action },
    {
      key: "case",
      header: "Case",
      cell: (r) =>
        r.caseId && r.caseReference ? (
          <Link
            to="/cases/$caseId"
            params={{ caseId: r.caseId }}
            className="underline-offset-2 hover:underline"
          >
            {r.caseReference}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "summary",
      header: "Summary",
      truncate: "max-w-80",
      title: (r) => summaryFor(r),
      cell: (r) => summaryFor(r),
    },
    {
      key: "details",
      header: <span className="sr-only">Details</span>,
      sticky: true,
      className: "w-px text-right",
      cell: (r) => (
        <Button type="button" variant="outline" size="sm" onClick={() => setDetailsRow(r)}>
          <Eye aria-hidden />
          Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every recorded action across the system."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exportAudit.isPending}
            onClick={() => exportAudit.mutate()}
          >
            <Download />
            Export CSV
          </Button>
        }
      />

      <AuditFiltersBar
        value={filters}
        onChange={setFilters}
        onClear={clear}
        loading={isFetching && !isLoading}
      />

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}
      <ResultsRegion
        label="audit entries"
        initialLoading={isLoading}
        skeleton={<ListSkeleton columns={5} />}
        fetching={isFetching && !isLoading}
      >
        {data && data.items.length === 0 && (
          <EmptyState
            icon={History}
            title="No activity"
            description="Nothing matches these filters."
          />
        )}
        {data && data.items.length > 0 && (
          <div className="mt-4">
            <ResponsiveTable
              columns={columns}
              rows={data.items}
              rowKey={(r) => r.id}
              renderCard={(r) => (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                  <p>
                    <span className="font-medium">{r.actorName ?? "—"}</span>{" "}
                    {r.actorRole && (
                      <span className="text-muted-foreground">({roleLabel(r.actorRole)})</span>
                    )}
                  </p>
                  <p>{summaryFor(r)}</p>
                  {r.caseId && r.caseReference && (
                    <Link
                      to="/cases/$caseId"
                      params={{ caseId: r.caseId }}
                      className="-my-3 inline-block py-3 underline-offset-2 hover:underline"
                    >
                      {r.caseReference}
                    </Link>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailsRow(r)}
                  >
                    <Eye aria-hidden />
                    Details
                  </Button>
                </div>
              )}
            />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </ResultsRegion>

      <ResponsiveDialog
        open={!!detailsRow}
        onOpenChange={(open) => !open && setDetailsRow(null)}
        title="What happened"
      >
        {detailsRow && <AuditDetails row={detailsRow} summary={summaryFor(detailsRow)} />}
      </ResponsiveDialog>
    </div>
  );
}
