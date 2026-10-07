import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { RoutingRuleDto } from "@/lib/api/types";
import {
  useBusinessUnits,
  useCaseTypes,
  useCategories,
  useDepartments,
  useEntities,
  useLegalReps,
} from "@/lib/queries/lookups";
import { PRIORITY_LABEL } from "@/lib/labels";
import { useCreateRoutingRule, useUpdateRoutingRule } from "./use-rules";

const ALL = "__none__";
const PRIORITIES = ["P1", "P2", "P3", "P4"] as const;

type MatchCriteria = NonNullable<RoutingRuleDto["matchCriteria"]> & {
  categoryId?: string | null;
  caseTypeId?: string | null;
  entityId?: string | null;
  businessUnitId?: string | null;
  departmentId?: string | null;
  priority?: string | null;
};

type Props = { rule: RoutingRuleDto | null; open: boolean; onOpenChange: (open: boolean) => void };

/** `rule: null` creates a new rule; otherwise edits it. Every match criterion is optional - an
 * unset one applies to all values of that dimension. */
export function RuleForm({ rule, open, onOpenChange }: Props) {
  const isCreate = rule === null;
  const criteria = (rule?.matchCriteria ?? {}) as MatchCriteria;
  const create = useCreateRoutingRule();
  const update = useUpdateRoutingRule(rule?.id ?? "");
  const mutation = isCreate ? create : update;

  const categories = useCategories();
  const caseTypes = useCaseTypes();
  const entities = useEntities();
  const businessUnits = useBusinessUnits();
  const departments = useDepartments();
  const legalReps = useLegalReps();

  const [categoryId, setCategoryId] = useState(criteria.categoryId ?? "");
  const [caseTypeId, setCaseTypeId] = useState(criteria.caseTypeId ?? "");
  const [entityId, setEntityId] = useState(criteria.entityId ?? "");
  const [businessUnitId, setBusinessUnitId] = useState(criteria.businessUnitId ?? "");
  const [departmentId, setDepartmentId] = useState(criteria.departmentId ?? "");
  const [priority, setPriority] = useState(criteria.priority ?? "");
  const [targetLegalRepId, setTargetLegalRepId] = useState(rule?.targetLegalRepId ?? "");
  const [priorityOrder, setPriorityOrder] = useState(String(rule?.priorityOrder ?? 0));

  const caseTypeOptions = (caseTypes.data ?? []).filter(
    (t) => !categoryId || t.categoryId === categoryId,
  );
  const businessUnitOptions = (businessUnits.data ?? []).filter(
    (b) => !entityId || b.entityId === entityId,
  );

  const confirm = () => {
    if (!targetLegalRepId) return;
    // Omit a criterion entirely to mean "any value" - the backend's matcher (auto-routing.ts)
    // only treats a missing key as a wildcard; an explicit `null` demands the case's own field
    // literally be null, which happens only for businessUnitId and never for the others.
    const matchCriteria = {
      ...(categoryId ? { categoryId } : {}),
      ...(caseTypeId ? { caseTypeId } : {}),
      ...(entityId ? { entityId } : {}),
      ...(businessUnitId ? { businessUnitId } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(priority ? { priority } : {}),
    };
    const order = Number(priorityOrder) || 0;
    if (isCreate) {
      create.mutate(
        { matchCriteria, targetLegalRepId, priorityOrder: order },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      update.mutate(
        { matchCriteria, targetLegalRepId, priorityOrder: order },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={mutation.isPending}
      title={isCreate ? "New routing rule" : "Edit routing rule"}
      description="An unset dimension matches any value. The first active rule that matches, in priority order, wins."
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          disabled={!targetLegalRepId || mutation.isPending}
          onClick={confirm}
        >
          Save
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="rule-category">Category</Label>
          <Select
            value={categoryId || ALL}
            onValueChange={(v) => {
              setCategoryId(v === ALL ? "" : v);
              setCaseTypeId("");
            }}
          >
            <SelectTrigger id="rule-category" className="mt-1 h-11 lg:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any</SelectItem>
              {categories.data?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rule-case-type">Case type</Label>
          <Select
            value={caseTypeId || ALL}
            onValueChange={(v) => setCaseTypeId(v === ALL ? "" : v)}
          >
            <SelectTrigger id="rule-case-type" className="mt-1 h-11 lg:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any</SelectItem>
              {caseTypeOptions.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rule-entity">Entity</Label>
          <Select
            value={entityId || ALL}
            onValueChange={(v) => {
              setEntityId(v === ALL ? "" : v);
              setBusinessUnitId("");
            }}
          >
            <SelectTrigger id="rule-entity" className="mt-1 h-11 lg:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any</SelectItem>
              {entities.data?.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rule-business-unit">Business unit</Label>
          <Select
            value={businessUnitId || ALL}
            onValueChange={(v) => setBusinessUnitId(v === ALL ? "" : v)}
          >
            <SelectTrigger id="rule-business-unit" className="mt-1 h-11 lg:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any</SelectItem>
              {businessUnitOptions.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rule-department">Department</Label>
          <Select
            value={departmentId || ALL}
            onValueChange={(v) => setDepartmentId(v === ALL ? "" : v)}
          >
            <SelectTrigger id="rule-department" className="mt-1 h-11 lg:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any</SelectItem>
              {departments.data?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rule-priority">Priority</Label>
          <Select value={priority || ALL} onValueChange={(v) => setPriority(v === ALL ? "" : v)}>
            <SelectTrigger id="rule-priority" className="mt-1 h-11 lg:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rule-rep">Assign to</Label>
          <Select value={targetLegalRepId} onValueChange={setTargetLegalRepId}>
            <SelectTrigger id="rule-rep" className="mt-1 h-11 lg:h-9">
              <SelectValue placeholder="Select a legal representative" />
            </SelectTrigger>
            <SelectContent>
              {legalReps.data?.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rule-order">Priority order (lower runs first)</Label>
          <Input
            id="rule-order"
            type="number"
            className="mt-1 h-11 lg:h-9"
            value={priorityOrder}
            onChange={(e) => setPriorityOrder(e.target.value)}
          />
        </div>
      </div>

      {mutation.isError && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {mutation.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}
