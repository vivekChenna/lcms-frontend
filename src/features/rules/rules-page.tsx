import { useState } from "react";
import { ListSkeleton } from "@/components/common/skeletons";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { Info } from "lucide-react";
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
import { SlaTargets } from "./sla-targets";
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

  if (isPending) {
    return (
      <div role="status" aria-label="Loading rules">
        <ListSkeleton columns={4} rows={4} />
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  // One entry per condition the rule checks; an empty list means it matches every case.
  const criteriaOf = (rule: RoutingRuleDto): { label: string; value: string }[] => {
    const c = rule.matchCriteria as Record<string, unknown>;
    const out: { label: string; value: string }[] = [];
    if (c["categoryId"])
      out.push({ label: "Category", value: nameOf(categories.data, c["categoryId"] as string) });
    if (c["caseTypeId"])
      out.push({ label: "Case type", value: nameOf(caseTypes.data, c["caseTypeId"] as string) });
    if (c["entityId"])
      out.push({ label: "Entity", value: nameOf(entities.data, c["entityId"] as string) });
    if (c["businessUnitId"])
      out.push({
        label: "Business unit",
        value: nameOf(businessUnits.data, c["businessUnitId"] as string),
      });
    if (c["departmentId"])
      out.push({
        label: "Department",
        value: nameOf(departments.data, c["departmentId"] as string),
      });
    if (c["priority"])
      out.push({
        label: "Priority",
        value:
          PRIORITY_LABEL[c["priority"] as keyof typeof PRIORITY_LABEL] ?? String(c["priority"]),
      });
    return out;
  };

  const describeCriteria = (rule: RoutingRuleDto) => {
    const items = criteriaOf(rule);
    if (items.length === 0) return <span className="text-sm">Any case</span>;
    return (
      <ul className="flex flex-wrap gap-1.5">
        {items.map(({ label, value }) => (
          <li
            key={label}
            className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </li>
        ))}
      </ul>
    );
  };

  const columns: Column<RoutingRuleDto>[] = [
    {
      key: "criteria",
      header: "Matches",
      cell: (r) => describeCriteria(r),
      className: "whitespace-normal",
    },
    // only roles that may look up legal representatives can see who a rule assigns to
    ...(legalReps.data
      ? [
          {
            key: "rep",
            header: "Assigned to",
            cell: (r: RoutingRuleDto) =>
              legalReps.data?.find((rep) => rep.id === r.targetLegalRepId)?.fullName ?? "—",
          } as Column<RoutingRuleDto>,
        ]
      : []),
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
        title="Rules & SLAs"
        description="How quickly legal responds to each type of case, and which legal representative a new case is automatically assigned to."
        actions={
          canEdit && (
            <Button type="button" size="sm" onClick={() => setFormRule(null)}>
              <Plus />
              New rule
            </Button>
          )
        }
      />

      {!canEdit && (
        <p
          role="note"
          className="mb-4 flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          This page is read-only. Only administrators can change rules and SLA targets.
        </p>
      )}

      <div className="space-y-8">
        <SlaTargets />

        <section aria-labelledby="rules-heading" className="space-y-3">
          <div>
            <h2 id="rules-heading" className="text-base font-semibold">
              Routing rules
            </h2>
            <p className="text-sm text-muted-foreground">
              Matched in order by category, case type, entity, business unit, department and
              priority.
            </p>
          </div>

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
                  {describeCriteria(r)}
                  <p className="text-sm text-muted-foreground">
                    →{" "}
                    {legalReps.data?.find((rep) => rep.id === r.targetLegalRepId)?.fullName ?? "—"}{" "}
                    (order {r.priorityOrder})
                  </p>
                  {canEdit ? (
                    <div className="flex items-center gap-2">
                      <ActiveToggle rule={r} />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormRule(r)}
                      >
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
        </section>
      </div>

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
