import { BellRing, FolderOpen } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
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
      // the row opens the case too; keep a click on the link from navigating twice
      onClick={(e) => e.stopPropagation()}
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

// The whole row opens the case. Accept/Reject sit in a wrapper that swallows clicks (dialogs they
// open render in a portal, and React events still bubble through it to the row).
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
    cell: (r) =>
      r.status === "Assigned" ? (
        <div onClick={(e) => e.stopPropagation()}>
          <AcceptRejectActions caseId={r.id} />
        </div>
      ) : null,
  },
];

/**
 * New assignments waiting for a yes or no, at the top of the dashboard so they can be handled
 * without opening the case. Shows nothing when there is nothing to accept.
 */
export function NeedsYourAction({ items }: { items: PanelItem[] }) {
  const waiting = items.filter((i) => i.status === "Assigned");
  if (waiting.length === 0) return null;
  return (
    <section
      aria-labelledby="needs-action-heading"
      className="rounded-xl border border-primary/30 bg-primary/5 p-4"
    >
      <h2 id="needs-action-heading" className="flex items-center gap-2 text-base font-semibold">
        <BellRing className="size-4 text-primary" aria-hidden />
        Needs your action
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          {waiting.length}
        </span>
      </h2>
      <p className="text-sm text-muted-foreground">
        These cases were assigned to you. Accept to start work, or reject to send them back.
      </p>
      <ul className="mt-3 space-y-2">
        {waiting.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate">
                <Link
                  to="/cases/$caseId"
                  params={{ caseId: item.id }}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {item.referenceNumber}
                </Link>{" "}
                — {item.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <PriorityBadge priority={item.priority} />
                <SlaBadge state={item.slaState} />
                <span className="text-sm text-muted-foreground">
                  {dueIn(item.resolutionDueAt).text}
                </span>
              </div>
            </div>
            <AcceptRejectActions caseId={item.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A legal rep's own open cases, oldest first (as the backend orders them), capped at 20. */
export function MyAssignedCases({ items }: { items: PanelItem[] }) {
  const navigate = useNavigate();
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
      <h2 className="mb-3 text-base font-semibold">My assigned cases</h2>
      <ResponsiveTable
        columns={columns}
        rows={items}
        rowKey={(r) => r.id}
        onRowClick={(r) => void navigate({ to: "/cases/$caseId", params: { caseId: r.id } })}
        rowLabel={(r) => `Open case ${r.referenceNumber}`}
        renderCard={(r) => (
          <div className="space-y-2">
            <p>
              <span className="font-medium">{r.referenceNumber}</span> — {r.title}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={r.status} />
              <PriorityBadge priority={r.priority} />
              <SlaBadge state={r.slaState} />
            </div>
            <p className="text-sm text-muted-foreground">{dueIn(r.resolutionDueAt).text}</p>
          </div>
        )}
        cardFooter={(r) => (r.status === "Assigned" ? <AcceptRejectActions caseId={r.id} /> : null)}
      />
    </div>
  );
}
