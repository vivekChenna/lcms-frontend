import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ConfidentialBadge,
  EscalatedBadge,
  PriorityBadge,
  SlaBadge,
  StatusBadge,
} from "@/components/common/badges";
import { ResponsiveTable, type Column } from "@/components/common/responsive-table";
import { formatDate, personLabel } from "@/lib/format";
import type { CaseListDto } from "@/lib/api/types";

type CaseRow = CaseListDto["items"][number];

// The whole row opens the case (ResponsiveTable wraps the mobile card in a <button>), so the
// reference is plain text here, not a nested <a>.
function CaseCell({ row }: { row: CaseRow }) {
  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <span className="font-medium">{row.referenceNumber}</span>
        {row.isConfidential && <ConfidentialBadge />}
        {row.isEscalated && <EscalatedBadge />}
      </div>
      <p className="truncate text-muted-foreground">{row.title}</p>
    </>
  );
}

const columns: Column<CaseRow>[] = [
  {
    key: "case",
    header: "Case",
    truncate: "max-w-64 xl:max-w-72",
    title: (r) => `${r.referenceNumber} — ${r.title}`,
    cell: (r) => <CaseCell row={r} />,
  },
  {
    key: "category",
    header: "Category",
    // the first column to go when space is tight; the row's title text still carries the category
    className: "hidden 2xl:table-cell",
    truncate: "max-w-40",
    title: (r) => `${r.categoryName ?? "—"} / ${r.caseTypeName ?? "—"}`,
    cell: (r) => (
      <>
        <p className="truncate">{r.categoryName ?? "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{r.caseTypeName ?? "—"}</p>
      </>
    ),
  },
  {
    key: "requester",
    header: "Requester",
    truncate: "max-w-36",
    title: (r) => r.requesterName ?? undefined,
    cell: (r) => (
      <>
        <p className="truncate">{r.requesterName ?? "—"}</p>
        {r.requesterDesignation && (
          <p className="truncate text-xs text-muted-foreground">{r.requesterDesignation}</p>
        )}
      </>
    ),
  },
  {
    key: "assigned",
    header: "Assigned to",
    truncate: "max-w-36",
    title: (r) => r.assignedLegalRepName ?? undefined,
    cell: (r) =>
      r.assignedLegalRepName ? (
        <>
          <p className="truncate">{r.assignedLegalRepName}</p>
          {r.assignedLegalRepDesignation && (
            <p className="truncate text-xs text-muted-foreground">
              {r.assignedLegalRepDesignation}
            </p>
          )}
        </>
      ) : (
        <span className="text-muted-foreground">Unassigned</span>
      ),
  },
  { key: "priority", header: "Priority", cell: (r) => <PriorityBadge priority={r.priority} /> },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  {
    key: "sla",
    header: "SLA",
    cell: (r) => <SlaBadge state={r.slaState} />,
  },
  { key: "created", header: "Created", cell: (r) => formatDate(r.createdAt) },
];

export function CasesTable({ rows, empty }: { rows: CaseRow[]; empty: ReactNode }) {
  const navigate = useNavigate();
  const open = (row: CaseRow) =>
    void navigate({ to: "/cases/$caseId", params: { caseId: row.id } });

  return (
    <ResponsiveTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      onRowClick={open}
      rowLabel={(r) => `Open case ${r.referenceNumber}`}
      empty={empty}
      renderCard={(r) => (
        <div className="space-y-2">
          <p className="min-w-0 truncate font-medium">
            {r.referenceNumber} — {r.title}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {r.isConfidential && <ConfidentialBadge />}
            {r.isEscalated && <EscalatedBadge />}
            <StatusBadge status={r.status} />
            <PriorityBadge priority={r.priority} />
            <SlaBadge state={r.slaState} />
          </div>
          <p className="text-sm text-muted-foreground">
            {personLabel(r.requesterName, r.requesterDesignation)} ·{" "}
            {r.assignedLegalRepName
              ? personLabel(r.assignedLegalRepName, r.assignedLegalRepDesignation)
              : "Unassigned"}
          </p>
          <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
        </div>
      )}
    />
  );
}
