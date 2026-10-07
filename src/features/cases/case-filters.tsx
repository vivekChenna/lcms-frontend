import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterSheet } from "@/components/common/filter-sheet";
import { useMe } from "@/lib/auth";
import {
  useBusinessUnits,
  useCaseTypes,
  useCategories,
  useDepartments,
  useEntities,
  useLegalReps,
} from "@/lib/queries/lookups";
import { PRIORITY_LABEL, SLA_LABEL, STATUS_ORDER } from "@/lib/labels";
import type { CasePriority, SlaState } from "@/lib/api/types";
import type { CasesSearch } from "./search-params";

/** shadcn's Select cannot hold an empty-string item value, so "no filter" gets its own token. */
const ALL = "__all__";
const PRIORITIES = ["P1", "P2", "P3", "P4"] as const;
const SLA_STATES = ["on_track", "at_risk", "breached", "met"] as const;

type Props = {
  value: CasesSearch;
  onChange: (patch: Partial<CasesSearch>) => void;
  onClear: () => void;
};

export function CaseFilters({ value, onChange, onClear }: Props) {
  const me = useMe();
  const [search, setSearch] = useState(value.search ?? "");

  // Debounce typing into a URL update; the effect below keeps the box in sync when the URL
  // changes from elsewhere (back/forward, Clear filters).
  useEffect(() => {
    const id = setTimeout(() => {
      if ((value.search ?? "") !== search) onChange({ search: search || undefined });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  useEffect(() => setSearch(value.search ?? ""), [value.search]);

  const categories = useCategories();
  const caseTypes = useCaseTypes();
  const departments = useDepartments();
  const entities = useEntities();
  const businessUnits = useBusinessUnits();
  const legalReps = useLegalReps();

  const caseTypeOptions = (caseTypes.data ?? []).filter(
    (t) => !value.categoryId || t.categoryId === value.categoryId,
  );
  const businessUnitOptions = (businessUnits.data ?? []).filter(
    (b) => !value.entityId || b.entityId === value.entityId,
  );

  const activeCount = Object.entries(value).filter(
    ([k, v]) => v !== undefined && k !== "page" && k !== "pageSize",
  ).length;

  return (
    <FilterSheet activeCount={activeCount} onClear={onClear}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <Label htmlFor="case-search">Search</Label>
          <Input
            id="case-search"
            className="mt-1 h-11 lg:h-9"
            placeholder="Reference, title or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <EnumFilter
          label="Status"
          value={value.status}
          options={STATUS_ORDER}
          onChange={(v) => onChange({ status: v })}
        />
        <EnumFilter
          label="Priority"
          value={value.priority}
          options={PRIORITIES}
          labelFor={(p) => PRIORITY_LABEL[p as CasePriority]}
          onChange={(v) => onChange({ priority: v as CasePriority | undefined })}
        />
        <EnumFilter
          label="SLA"
          value={value.slaState}
          options={SLA_STATES}
          labelFor={(s) => SLA_LABEL[s as SlaState]}
          onChange={(v) => onChange({ slaState: v as SlaState | undefined })}
        />

        <NameFilter
          label="Category"
          value={value.categoryId}
          items={categories.data}
          onChange={(v) => onChange({ categoryId: v, caseTypeId: undefined })}
        />
        <NameFilter
          label="Case type"
          value={value.caseTypeId}
          items={caseTypeOptions}
          onChange={(v) => onChange({ caseTypeId: v })}
        />
        <NameFilter
          label="Department"
          value={value.departmentId}
          items={departments.data}
          onChange={(v) => onChange({ departmentId: v })}
        />
        <NameFilter
          label="Entity"
          value={value.entityId}
          items={entities.data}
          onChange={(v) => onChange({ entityId: v, businessUnitId: undefined })}
        />
        <NameFilter
          label="Business unit"
          value={value.businessUnitId}
          items={businessUnitOptions}
          onChange={(v) => onChange({ businessUnitId: v })}
        />

        {me?.role === "legal_manager" && (
          <NameFilter
            label="Assigned to"
            value={value.assignedLegalRepId}
            items={legalReps.data?.map((r) => ({ id: r.id, name: r.fullName }))}
            onChange={(v) => onChange({ assignedLegalRepId: v })}
          />
        )}
        {(me?.role === "legal_rep" || me?.role === "admin") && (
          <div className="flex items-center gap-2 self-end pb-1">
            <Switch
              id="case-mine"
              checked={value.assignedLegalRepId === me.id}
              onCheckedChange={(checked) =>
                onChange({ assignedLegalRepId: checked ? me.id : undefined })
              }
            />
            <Label htmlFor="case-mine">Mine</Label>
          </div>
        )}

        <div className="flex items-center gap-2 self-end pb-1">
          <Switch
            id="case-open"
            checked={value.open === "true"}
            onCheckedChange={(checked) => onChange({ open: checked ? "true" : undefined })}
          />
          <Label htmlFor="case-open">Open only</Label>
        </div>
      </div>
    </FilterSheet>
  );
}

function EnumFilter<T extends string>({
  label,
  value,
  options,
  labelFor,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: readonly T[];
  labelFor?: (v: T) => string;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select
        value={value ?? ALL}
        onValueChange={(v) => onChange(v === ALL ? undefined : (v as T))}
      >
        <SelectTrigger className="mt-1 h-11 lg:h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {labelFor ? labelFor(o) : o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NameFilter({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string | undefined;
  items: { id: string; name: string }[] | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
        <SelectTrigger className="mt-1 h-11 lg:h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {items?.map((i) => (
            <SelectItem key={i.id} value={i.id}>
              {i.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
