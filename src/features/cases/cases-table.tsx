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
import { formatDate } from "@/lib/format";
import type { CaseListDto } from "@/lib/api/types";

type CaseRow = CaseListDto["items"][number];

// The whole row opens the case (ResponsiveTable wraps the mobile card in a <button>), so the
// reference is styled like a link but is plain text here, not a nested <a>.
function RefCell({ row }: { row: CaseRow }) {
  return <span className="font-medium underline-offset-2">{row.referenceNumber}</span>;
}

function TitleCell({ row }: { row: CaseRow }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 truncate">{row.title}</span>
      {row.isConfidential && <ConfidentialBadge />}
      {row.isEscalated && <EscalatedBadge />}
    </div>
  );
}

const columns: Column<CaseRow>[] = [
  { key: "ref", header: "Reference", cell: (r) => <RefCell row={r} /> },
  { key: "title", header: "Title", cell: (r) => <TitleCell row={r} /> },
  {
    key: "category",
    header: "Category / type",
    cell: (r) => `${r.categoryName ?? "—"} / ${r.caseTypeName ?? "—"}`,
  },
  { key: "requester", header: "Requester", cell: (r) => r.requesterName ?? "—" },
  {
    key: "assigned",
    header: "Assigned to",
    cell: (r) => r.assignedLegalRepName ?? "Unassigned",
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
            {r.requesterName ?? "—"} · {r.assignedLegalRepName ?? "Unassigned"}
          </p>
          <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
        </div>
      )}
    />
  );
}
