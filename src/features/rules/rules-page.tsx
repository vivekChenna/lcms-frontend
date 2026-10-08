import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { ResponsiveTable, type Column } from "@/components/common/responsive-table";
import type { RoutingRuleDto } from "@/lib/api/types";
import { useMe } from "@/lib/auth";
import { PRIORITY_LABEL } from "@/lib/labels";
import {
  nameOf,
  useBusinessUnits,
  useCaseTypes,
  useCategories,
  useDepartments,
  useEntities,
  useLegalReps,
} from "@/lib/queries/lookups";
import { can } from "@/lib/permissions";
import { RuleForm } from "./rule-form";
import { useRoutingRules, useUpdateRoutingRule } from "./use-rules";

function ActiveToggle({ rule }: { rule: RoutingRuleDto }) {
  const update = useUpdateRoutingRule(rule.id);
  return (
    <Switch
      checked={rule.isActive}
      onCheckedChange={(checked) => update.mutate({ isActive: checked })}
      aria-label={rule.isActive ? "Deactivate rule" : "Activate rule"}
    />
  );
}

export function RulesPage() {
  const me = useMe();
  const canEdit = !!me && can.editRules(me.role);
  const { data, isPending, isError, error, refetch } = useRoutingRules();
  const categories = useCategories();
  const caseTypes = useCaseTypes();
  const entities = useEntities();
  const businessUnits = useBusinessUnits();
  const departments = useDepartments();
  const legalReps = useLegalReps();

  const [formRule, setFormRule] = useState<RoutingRuleDto | null | undefined>(undefined);

  if (isPending) return null;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const describeCriteria = (rule: RoutingRuleDto) => {
    const c = rule.matchCriteria as Record<string, unknown>;
    const parts: string[] = [];
    if (c["categoryId"])
      parts.push(`Category: ${nameOf(categories.data, c["categoryId"] as string)}`);
    if (c["caseTypeId"])
      parts.push(`Case type: ${nameOf(caseTypes.data, c["caseTypeId"] as string)}`);
    if (c["entityId"]) parts.push(`Entity: ${nameOf(entities.data, c["entityId"] as string)}`);
    if (c["businessUnitId"])
      parts.push(`Business unit: ${nameOf(businessUnits.data, c["businessUnitId"] as string)}`);
    if (c["departmentId"])
      parts.push(`Department: ${nameOf(departments.data, c["departmentId"] as string)}`);
    if (c["priority"])
      parts.push(
        `Priority: ${PRIORITY_LABEL[c["priority"] as keyof typeof PRIORITY_LABEL] ?? c["priority"]}`,
      );
    return parts.length > 0 ? parts.join(", ") : "Any case";
  };

  const columns: Column<RoutingRuleDto>[] = [
    {
      key: "criteria",
      header: "Matches",
      cell: (r) => <span className="text-sm">{describeCriteria(r)}</span>,
    },
    {
      key: "rep",
      header: "Assigned to",
      cell: (r) => legalReps.data?.find((rep) => rep.id === r.targetLegalRepId)?.fullName ?? "—",
    },
    { key: "order", header: "Order", cell: (r) => r.priorityOrder },
    {
      key: "status",
      header: "Status",
      cell: (r) =>
        canEdit ? (
          <ActiveToggle rule={r} />
        ) : (
          <Badge variant={r.isActive ? "outline" : "secondary"}>
            {r.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
    },
    ...(canEdit
      ? [
          {
            key: "actions",
            header: "",
            cell: (r: RoutingRuleDto) => (
              <Button type="button" variant="outline" size="sm" onClick={() => setFormRule(r)}>
                Edit
              </Button>
            ),
          } as Column<RoutingRuleDto>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Routing rules"
        description="Which legal representative is auto-assigned for a case, by category, type, entity, business unit, department and priority."
        actions={
          canEdit && (
            <Button type="button" size="sm" onClick={() => setFormRule(null)}>
              <Plus />
              New rule
            </Button>
          )
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No routing rules yet"
          description="Unassigned cases will need manual assignment."
        />
      ) : (
        <ResponsiveTable
          columns={columns}
          rows={data}
          rowKey={(r) => r.id}
          renderCard={(r) => (
            <div className="space-y-1">
              <p className="text-sm">{describeCriteria(r)}</p>
              <p className="text-sm text-muted-foreground">
                → {legalReps.data?.find((rep) => rep.id === r.targetLegalRepId)?.fullName ?? "—"}{" "}
                (order {r.priorityOrder})
              </p>
              {canEdit ? (
                <div className="flex items-center gap-2">
                  <ActiveToggle rule={r} />
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormRule(r)}>
                    Edit
                  </Button>
                </div>
              ) : (
                <Badge variant={r.isActive ? "outline" : "secondary"}>
                  {r.isActive ? "Active" : "Inactive"}
                </Badge>
              )}
            </div>
          )}
        />
      )}

      {formRule !== undefined && (
        <RuleForm
          rule={formRule}
          open={formRule !== undefined}
          onOpenChange={(open) => !open && setFormRule(undefined)}
        />
      )}
    </div>
  );
}
