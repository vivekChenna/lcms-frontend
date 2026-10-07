import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveTable, type Column } from "@/components/common/responsive-table";
import { EmptyState } from "@/components/common/empty-state";
import { PriorityBadge, StatusBadge } from "@/components/common/badges";
import type { DashboardDto } from "@/lib/api/types";
import { AssignDialog } from "@/features/case-detail/actions/assign";

type ManagerPanels = NonNullable<DashboardDto["managerPanels"]>;
type RepLoad = ManagerPanels["openCaseloadByRep"][number];
type PanelItem = ManagerPanels["unassigned"]["items"][number];

const loadColumns: Column<RepLoad>[] = [
  {
    key: "name",
    header: "Representative",
    cell: (r) => (
      <Link to="/cases" search={{ assignedLegalRepId: r.legalRepId, open: "true" } as never}>
        {r.fullName}
      </Link>
    ),
  },
  { key: "open", header: "Open", cell: (r) => r.openCount },
  { key: "overdue", header: "Overdue", cell: (r) => r.overdueCount },
];

function OpenCaseloadByRep({ rows }: { rows: RepLoad[] }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium">Open caseload by representative</h2>
      <ResponsiveTable
        columns={loadColumns}
        rows={rows}
        rowKey={(r) => r.legalRepId}
        renderCard={(r) => (
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/cases"
              search={{ assignedLegalRepId: r.legalRepId, open: "true" } as never}
              className="font-medium"
            >
              {r.fullName}
            </Link>
            <span className="text-sm text-muted-foreground">
              {r.openCount} open · {r.overdueCount} overdue
            </span>
          </div>
        )}
        empty={<EmptyState icon={Users} title="No legal representatives yet" />}
      />
    </div>
  );
}

function UnassignedPanel({ count, items }: ManagerPanels["unassigned"]) {
  const [assignId, setAssignId] = useState<string | null>(null);
  const columns: Column<PanelItem>[] = [
    { key: "ref", header: "Reference", cell: (r) => r.referenceNumber },
    { key: "title", header: "Title", cell: (r) => <span className="line-clamp-2">{r.title}</span> },
    { key: "priority", header: "Priority", cell: (r) => <PriorityBadge priority={r.priority} /> },
    {
      key: "assign",
      header: "",
      cell: (r) => (
        <Button type="button" size="sm" className="h-10 lg:h-9" onClick={() => setAssignId(r.id)}>
          Assign
        </Button>
      ),
    },
  ];
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium">Unassigned ({count})</h2>
      <ResponsiveTable
        columns={columns}
        rows={items}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={Users} title="Nothing unassigned" />}
        renderCard={(r) => (
          <div className="space-y-2">
            <p className="font-medium">
              {r.referenceNumber} — {r.title}
            </p>
            <PriorityBadge priority={r.priority} />
            <div>
              <Button
                type="button"
                size="sm"
                className="h-10 lg:h-9"
                onClick={() => setAssignId(r.id)}
              >
                Assign
              </Button>
            </div>
          </div>
        )}
      />
      {assignId && (
        <AssignDialog caseId={assignId} open onOpenChange={(o) => !o && setAssignId(null)} />
      )}
    </div>
  );
}

function AwaitingAcceptancePanel({ count, items }: ManagerPanels["awaitingAcceptance"]) {
  const columns: Column<PanelItem>[] = [
    { key: "ref", header: "Reference", cell: (r) => r.referenceNumber },
    { key: "title", header: "Title", cell: (r) => <span className="line-clamp-2">{r.title}</span> },
    { key: "rep", header: "Assigned to", cell: (r) => r.assignedLegalRepName ?? "—" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium">Awaiting acceptance ({count})</h2>
      <ResponsiveTable
        columns={columns}
        rows={items}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={Users} title="Nothing awaiting acceptance" />}
        renderCard={(r) => (
          <div className="space-y-1">
            <p className="font-medium">
              {r.referenceNumber} — {r.title}
            </p>
            <p className="text-sm text-muted-foreground">{r.assignedLegalRepName ?? "—"}</p>
            <StatusBadge status={r.status} />
          </div>
        )}
      />
    </div>
  );
}

export function ManagerPanels({ panels }: { panels: ManagerPanels }) {
  return (
    <div className="space-y-6">
      <OpenCaseloadByRep rows={panels.openCaseloadByRep} />
      <UnassignedPanel {...panels.unassigned} />
      <AwaitingAcceptancePanel {...panels.awaitingAcceptance} />
    </div>
  );
}
