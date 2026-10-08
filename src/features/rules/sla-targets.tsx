import { EmptyState } from "@/components/common/empty-state";
import { ResponsiveTable, type Column } from "@/components/common/responsive-table";
import { Badge } from "@/components/ui/badge";
import type { CaseTypeDto } from "@/lib/api/types";
import { nameOf, useCaseTypes, useCategories } from "@/lib/queries/lookups";
import { Timer } from "lucide-react";
import { formatHours } from "./format-hours";

/** The service-level targets of every case type: how fast legal acknowledges and resolves. */
export function SlaTargets() {
  const caseTypes = useCaseTypes();
  const categories = useCategories();
  const rows = (caseTypes.data ?? []).filter((t) => t.isActive);

  const columns: Column<CaseTypeDto>[] = [
    { key: "category", header: "Category", cell: (t) => nameOf(categories.data, t.categoryId) },
    {
      key: "type",
      header: "Case type",
      truncate: "max-w-64",
      title: (t) => t.name,
      cell: (t) => <span className="font-medium">{t.name}</span>,
    },
    { key: "ack", header: "Acknowledge within", cell: (t) => formatHours(t.slaAckHours) },
    { key: "resolve", header: "Resolve within", cell: (t) => formatHours(t.slaResolutionHours) },
  ];

  return (
    <section aria-labelledby="sla-heading" className="space-y-3">
      <div>
        <h2 id="sla-heading" className="text-base font-semibold">
          SLA targets
        </h2>
        <p className="text-sm text-muted-foreground">
          How quickly legal acknowledges and resolves each type of case. A case is{" "}
          <Badge variant="outline" className="align-middle">
            At risk
          </Badge>{" "}
          when less than 20% of its resolution time is left.
        </p>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Timer} title="No case types configured yet" />
      ) : (
        <ResponsiveTable
          columns={columns}
          rows={rows}
          rowKey={(t) => t.id}
          renderCard={(t) => (
            <div className="space-y-1">
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-muted-foreground">
                {nameOf(categories.data, t.categoryId)}
              </p>
              <p className="text-sm">
                Acknowledge within {formatHours(t.slaAckHours)} · Resolve within{" "}
                {formatHours(t.slaResolutionHours)}
              </p>
            </div>
          )}
        />
      )}
    </section>
  );
}
