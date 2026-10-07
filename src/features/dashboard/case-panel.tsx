import { FolderOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ResponsiveTable, type Column } from "@/components/common/responsive-table";
import { EmptyState } from "@/components/common/empty-state";
import { PriorityBadge, SlaBadge, StatusBadge } from "@/components/common/badges";
import { dueIn } from "@/lib/format";
import type { DashboardDto } from "@/lib/api/types";
import { AcceptRejectActions } from "@/features/case-detail/actions/accept-reject";

export type PanelItem = NonNullable<DashboardDto["myAssignedCases"]>[number];

function RefLink({ item }: { item: PanelItem }) {
  return (
    <Link
      to="/cases/$caseId"
      params={{ caseId: item.id }}
      className="font-medium underline-offset-2 hover:underline"
    >
      {item.referenceNumber}
    </Link>
  );
}

function DueCell({ item }: { item: PanelItem }) {
  const due = dueIn(item.resolutionDueAt);
  return <span className={due.overdue ? "text-danger" : ""}>{due.text}</span>;
}

// No `onRowClick`: rows carry their own Link (reference) plus the Accept/Reject buttons, and
// ResponsiveTable's mobile card wraps in a <button> only when `onRowClick` is given — interactive
// content inside that button would be invalid, so navigation here is a plain Link instead.
const columns: Column<PanelItem>[] = [
  { key: "ref", header: "Reference", cell: (r) => <RefLink item={r} /> },
  { key: "title", header: "Title", cell: (r) => <span className="line-clamp-2">{r.title}</span> },
  { key: "priority", header: "Priority", cell: (r) => <PriorityBadge priority={r.priority} /> },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "sla", header: "SLA", cell: (r) => <SlaBadge state={r.slaState} /> },
  { key: "due", header: "Due", cell: (r) => <DueCell item={r} /> },
  {
    key: "actions",
    header: "",
    cell: (r) => (r.status === "Assigned" ? <AcceptRejectActions caseId={r.id} /> : null),
  },
];

/** A legal rep's own open cases, oldest first (as the backend orders them), capped at 20. */
export function MyAssignedCases({ items }: { items: PanelItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Nothing assigned to you"
        description="New assignments appear here."
      />
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium">My assigned cases</h2>
      <ResponsiveTable
        columns={columns}
        rows={items}
        rowKey={(r) => r.id}
        renderCard={(r) => (
          <div className="space-y-2">
            <p>
              <RefLink item={r} /> — {r.title}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={r.status} />
              <PriorityBadge priority={r.priority} />
              <SlaBadge state={r.slaState} />
            </div>
            <p className="text-sm text-muted-foreground">{dueIn(r.resolutionDueAt).text}</p>
            {r.status === "Assigned" && <AcceptRejectActions caseId={r.id} />}
          </div>
        )}
      />
    </div>
  );
}
