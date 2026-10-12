import { useState, type ReactNode } from "react";
import { personLabel } from "@/lib/format";
import { Link, useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveTable, type Column } from "@/components/common/responsive-table";
import { EmptyState } from "@/components/common/empty-state";
import { PriorityBadge, StatusBadge } from "@/components/common/badges";
import type { DashboardDto } from "@/lib/api/types";
import { AssignDialog } from "@/features/case-detail/actions/assign";
import { cn } from "@/lib/utils";

type ManagerPanels = NonNullable<DashboardDto["managerPanels"]>;
type RepLoad = ManagerPanels["openCaseloadByRep"][number];
type PanelItem = ManagerPanels["unassigned"]["items"][number];

function Panel({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function OpenCaseloadByRep({ rows }: { rows: RepLoad[] }) {
  const busiest = Math.max(1, ...rows.map((r) => r.openCount));
  const repSearch = (r: RepLoad) => ({ assignedLegalRepId: r.legalRepId, open: "true" }) as never;

  const columns: Column<RepLoad>[] = [
    {
      key: "name",
      header: "Representative",
      cell: (r) => (
        <Link
          to="/cases"
          search={repSearch(r)}
          className="font-medium underline-offset-2 hover:underline"
        >
          {r.fullName}
        </Link>
      ),
    },
    {
      key: "open",
      header: "Open cases",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="w-6 tabular-nums">{r.openCount}</span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${(r.openCount / busiest) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "overdue",
      header: "Overdue",
      cell: (r) => (
        <span className={cn("tabular-nums", r.overdueCount > 0 && "font-medium text-danger")}>
          {r.overdueCount}
        </span>
      ),
    },
  ];

  return (
    <Panel title="Open caseload by representative">
      <ResponsiveTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.legalRepId}
        renderCard={(r) => (
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/cases"
              search={repSearch(r)}
              className="-my-3 block min-w-0 truncate py-3 font-medium"
            >
              {r.fullName}
            </Link>
            <span className="shrink-0 text-sm text-muted-foreground">
              {r.openCount} open, {r.overdueCount} overdue
            </span>
          </div>
        )}
        empty={<EmptyState icon={Users} title="No legal representatives yet" />}
      />
    </Panel>
  );
}

function useOpenCase() {
  const navigate = useNavigate();
  return (r: PanelItem) => void navigate({ to: "/cases/$caseId", params: { caseId: r.id } });
}

function UnassignedPanel({ count, items }: ManagerPanels["unassigned"]) {
  const openCase = useOpenCase();
  const [assignId, setAssignId] = useState<string | null>(null);
  const columns: Column<PanelItem>[] = [
    {
      key: "case",
      header: "Case",
      truncate: "max-w-72",
      title: (r) => `${r.referenceNumber} — ${r.title}`,
      cell: (r) => (
        <>
          <p className="font-medium">{r.referenceNumber}</p>
          <p className="truncate text-muted-foreground">{r.title}</p>
        </>
      ),
    },
    { key: "priority", header: "Priority", cell: (r) => <PriorityBadge priority={r.priority} /> },
    {
      key: "assign",
      header: <span className="sr-only">Assign</span>,
      className: "w-px text-right",
      cell: (r) => (
        <Button
          type="button"
          size="sm"
          className="h-11 lg:h-9"
          onClick={(e) => {
            e.stopPropagation(); // the row itself opens the case
            setAssignId(r.id);
          }}
        >
          Assign
        </Button>
      ),
    },
  ];
  return (
    <Panel title="Unassigned" count={count}>
      <ResponsiveTable
        columns={columns}
        rows={items}
        rowKey={(r) => r.id}
        onRowClick={openCase}
        rowLabel={(r) => `Open case ${r.referenceNumber}`}
        empty={<EmptyState icon={Users} title="Nothing unassigned" />}
        renderCard={(r) => (
          <div className="space-y-2">
            <p className="font-medium">
              {r.referenceNumber} — {r.title}
            </p>
            <PriorityBadge priority={r.priority} />
          </div>
        )}
        cardFooter={(r) => (
          <Button type="button" size="sm" className="h-11" onClick={() => setAssignId(r.id)}>
            Assign
          </Button>
        )}
      />
      {assignId && (
        <AssignDialog caseId={assignId} open onOpenChange={(o) => !o && setAssignId(null)} />
      )}
    </Panel>
  );
}

function AwaitingAcceptancePanel({ count, items }: ManagerPanels["awaitingAcceptance"]) {
  const openCase = useOpenCase();
  const columns: Column<PanelItem>[] = [
    {
      key: "case",
      header: "Case",
      truncate: "max-w-72",
      title: (r) => `${r.referenceNumber} — ${r.title}`,
      cell: (r) => (
        <>
          <p className="font-medium">{r.referenceNumber}</p>
          <p className="truncate text-muted-foreground">{r.title}</p>
        </>
      ),
    },
    {
      key: "rep",
      header: "Assigned to",
      truncate: "max-w-40",
      title: (r) => r.assignedLegalRepName ?? undefined,
      cell: (r) => personLabel(r.assignedLegalRepName, r.assignedLegalRepDesignation),
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];
  return (
    <Panel title="Awaiting acceptance" count={count}>
      <ResponsiveTable
        columns={columns}
        rows={items}
        rowKey={(r) => r.id}
        onRowClick={openCase}
        rowLabel={(r) => `Open case ${r.referenceNumber}`}
        empty={<EmptyState icon={Users} title="Nothing awaiting acceptance" />}
        renderCard={(r) => (
          <div className="space-y-1">
            <p className="font-medium">
              {r.referenceNumber} — {r.title}
            </p>
            <p className="text-sm text-muted-foreground">
              {personLabel(r.assignedLegalRepName, r.assignedLegalRepDesignation)}
            </p>
            <StatusBadge status={r.status} />
          </div>
        )}
      />
    </Panel>
  );
}

export function ManagerPanels({ panels }: { panels: ManagerPanels }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-8 xl:grid-cols-2">
        <UnassignedPanel {...panels.unassigned} />
        <AwaitingAcceptancePanel {...panels.awaitingAcceptance} />
      </div>
      <OpenCaseloadByRep rows={panels.openCaseloadByRep} />
    </div>
  );
}
