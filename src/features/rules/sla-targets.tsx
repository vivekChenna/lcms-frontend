import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { ResponsiveTable, type Column } from "@/components/common/responsive-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUpdateCaseTypeMasterData } from "@/features/master-data/use-master-data";
import type { CaseTypeDto } from "@/lib/api/types";
import { useMe } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { nameOf, useCaseTypes, useCategories } from "@/lib/queries/lookups";
import { Pencil, Plus, Timer } from "lucide-react";
import { CaseTypeDialog } from "./case-type-dialog";
import { formatHours } from "./format-hours";
import { SlaEditDialog } from "./sla-edit-dialog";

function ActiveSwitch({ caseType }: { caseType: CaseTypeDto }) {
  const update = useUpdateCaseTypeMasterData(caseType.id);
  return (
    <Switch
      checked={caseType.isActive}
      disabled={update.isPending}
      onCheckedChange={(checked) => update.mutate({ isActive: checked })}
      aria-label={caseType.isActive ? `Deactivate ${caseType.name}` : `Activate ${caseType.name}`}
    />
  );
}

/**
 * Every case type with its service-level targets: how fast legal acknowledges and resolves. Admins
 * also add case types here, edit their targets and switch them on or off; everyone else sees the
 * active ones, read-only.
 */
export function SlaTargets() {
  const me = useMe();
  const canEdit = !!me && can.editRules(me.role);
  const caseTypes = useCaseTypes();
  const categories = useCategories();
  const rows = (caseTypes.data ?? []).filter((t) => canEdit || t.isActive);
  const [editing, setEditing] = useState<CaseTypeDto | null>(null);
  const [adding, setAdding] = useState(false);

  const editButton = (t: CaseTypeDto) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-11 lg:h-8"
      aria-label={`Edit SLA for ${t.name}`}
      onClick={() => setEditing(t)}
    >
      <Pencil aria-hidden />
      Edit
    </Button>
  );

  const columns: Column<CaseTypeDto>[] = [
    { key: "category", header: "Category", cell: (t) => nameOf(categories.data, t.categoryId) },
    {
      key: "type",
      header: "Case type",
      truncate: "max-w-64",
      title: (t) => t.name,
      cell: (t) => (
        <span className="flex items-center gap-2">
          <span className={t.isActive ? "font-medium" : "font-medium text-muted-foreground"}>
            {t.name}
          </span>
          {!t.isActive && <Badge variant="secondary">Inactive</Badge>}
        </span>
      ),
    },
    { key: "ack", header: "Acknowledge within", cell: (t) => formatHours(t.slaAckHours) },
    { key: "resolve", header: "Resolve within", cell: (t) => formatHours(t.slaResolutionHours) },
    ...(canEdit
      ? [
          {
            key: "active",
            header: "Active",
            cell: (t: CaseTypeDto) => <ActiveSwitch caseType={t} />,
          },
          {
            key: "edit",
            header: <span className="sr-only">Edit</span>,
            className: "w-px text-right",
            cell: editButton,
          },
        ]
      : []),
  ];

  return (
    <section aria-labelledby="sla-heading" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="sla-heading" className="text-base font-semibold">
            Case types and SLA targets
          </h2>
          <p className="text-sm text-muted-foreground">
            How quickly legal acknowledges and resolves each type of case. A case is{" "}
            <Badge variant="outline" className="align-middle">
              At risk
            </Badge>{" "}
            when less than 20% of its resolution time is left.
          </p>
        </div>
        {canEdit && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus aria-hidden />
            New case type
          </Button>
        )}
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
              <p className="flex items-center gap-2 font-medium">
                {t.name}
                {!t.isActive && <Badge variant="secondary">Inactive</Badge>}
              </p>
              <p className="text-sm text-muted-foreground">
                {nameOf(categories.data, t.categoryId)}
              </p>
              <p className="text-sm">
                Acknowledge within {formatHours(t.slaAckHours)} · Resolve within{" "}
                {formatHours(t.slaResolutionHours)}
              </p>
              {canEdit && (
                <div className="flex items-center gap-3 pt-1">
                  {editButton(t)}
                  <ActiveSwitch caseType={t} />
                </div>
              )}
            </div>
          )}
        />
      )}
      {editing && (
        <SlaEditDialog
          key={editing.id}
          caseType={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
      {adding && <CaseTypeDialog open onOpenChange={(o) => !o && setAdding(false)} />}
    </section>
  );
}
