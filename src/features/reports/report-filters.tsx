import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PRIORITY_LABEL, STATUS_ORDER } from "@/lib/labels";
import type { CasePriority } from "@/lib/api/types";
import { can } from "@/lib/permissions";
import { dateRangeInvalid } from "./use-reports";
import type { ReportsSearch } from "./search-params";

const ALL = "__all__";
const PRIORITIES = ["P1", "P2", "P3", "P4"] as const;

type Props = {
  value: ReportsSearch;
  onChange: (patch: Partial<ReportsSearch>) => void;
  onClear: () => void;
};

export function ReportFilters({ value, onChange, onClear }: Props) {
  const me = useMe();
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
  const activeCount = Object.values(value).filter((v) => v !== undefined).length;
  const invalidRange = dateRangeInvalid(value);

  return (
    <FilterSheet activeCount={activeCount} onClear={onClear}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        {me && can.assign(me.role) && (
          <NameFilter
            label="Assigned rep"
            value={value.assignedLegalRepId}
            items={legalReps.data?.map((r) => ({ id: r.id, name: r.fullName }))}
            onChange={(v) => onChange({ assignedLegalRepId: v })}
          />
        )}

        <div>
          <Label htmlFor="report-from">Created from</Label>
          <Input
            id="report-from"
            type="date"
            className="mt-1 h-11 lg:h-9"
            value={value.createdFrom ?? ""}
            onChange={(e) => onChange({ createdFrom: e.target.value || undefined })}
          />
        </div>
        <div>
          <Label htmlFor="report-to">Created to</Label>
          <Input
            id="report-to"
            type="date"
            className="mt-1 h-11 lg:h-9"
            value={value.createdTo ?? ""}
            onChange={(e) => onChange({ createdTo: e.target.value || undefined })}
          />
        </div>
        {invalidRange && (
          <p role="alert" className="sm:col-span-2 lg:col-span-4 text-sm text-danger">
            "Created from" must not be after "Created to".
          </p>
        )}
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
