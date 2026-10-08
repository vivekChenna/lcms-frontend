import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterSelect } from "@/components/common/filter-select";
import { FilterSheet } from "@/components/common/filter-sheet";
import { SearchInput } from "@/components/common/search-input";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useDebouncedField } from "@/hooks/use-debounced-field";
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

/** The filters that live behind "More filters" on a wide screen. */
const ADVANCED_KEYS: (keyof CasesSearch)[] = [
  "categoryId",
  "caseTypeId",
  "departmentId",
  "entityId",
  "businessUnitId",
  "assignedLegalRepId",
  "open",
];

type Props = {
  value: CasesSearch;
  onChange: (patch: Partial<CasesSearch>) => void;
  onClear: () => void;
  /** A search or filter request is in flight (shows the spinner in the search box). */
  loading?: boolean | undefined;
};

export function CaseFilters({ value, onChange, onClear, loading }: Props) {
  const me = useMe();
  const bp = useBreakpoint();
  const wide = bp === "lg" || bp === "xl";
  // Typing is debounced into a URL update; the box follows the URL when it changes from
  // elsewhere (back/forward, Clear filters).
  const {
    text: search,
    setText: setSearch,
    waiting: searchWaiting,
  } = useDebouncedField(value.search ?? "", (v) => onChange({ search: v || undefined }));

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
  const advancedCount = ADVANCED_KEYS.filter((k) => value[k] !== undefined).length;

  const searchBox = (
    <SearchInput
      id="case-search"
      withIcon
      aria-label="Search"
      className="h-11 lg:h-10"
      placeholder="Search by reference, title or description"
      value={search}
      busy={searchWaiting || loading}
      onChange={(e) => setSearch(e.target.value)}
    />
  );

  const advancedFields = (
    <>
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
        <ToggleFilter
          id="case-mine"
          label="Only my cases"
          checked={value.assignedLegalRepId === me.id}
          onChange={(checked) => onChange({ assignedLegalRepId: checked ? me.id : undefined })}
        />
      )}
      <ToggleFilter
        id="case-open"
        label="Open cases only"
        checked={value.open === "true"}
        onChange={(checked) => onChange({ open: checked ? "true" : undefined })}
      />
    </>
  );

  if (wide) {
    return (
      <div className="flex items-center gap-2">
        <div className="min-w-60 flex-1">{searchBox}</div>
        <FilterSelect
          label="Status"
          value={value.status}
          options={STATUS_ORDER.map((s) => ({ value: s, label: s }))}
          onChange={(v) => onChange({ status: v as CasesSearch["status"] })}
        />
        <FilterSelect
          label="Priority"
          value={value.priority}
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p as CasePriority] }))}
          onChange={(v) => onChange({ priority: v as CasePriority | undefined })}
        />
        <FilterSelect
          label="SLA"
          value={value.slaState}
          options={SLA_STATES.map((s) => ({ value: s, label: SLA_LABEL[s as SlaState] }))}
          onChange={(v) => onChange({ slaState: v as SlaState | undefined })}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={advancedCount > 0 ? "h-10 border-primary/40 bg-primary/5" : "h-10 bg-card"}
            >
              <SlidersHorizontal aria-hidden />
              More filters
              {advancedCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {advancedCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[34rem] max-w-[calc(100vw-2rem)] p-4">
            <p className="mb-3 text-sm font-medium">More filters</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">{advancedFields}</div>
          </PopoverContent>
        </Popover>
        {activeCount > 0 && (
          <Button type="button" variant="ghost" className="h-10" onClick={onClear}>
            Clear all
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">{searchBox}</div>
      <FilterSheet activeCount={activeCount} onClear={onClear}>
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
        {advancedFields}
      </FilterSheet>
    </div>
  );
}

function ToggleFilter({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 self-end pb-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id}>{label}</Label>
    </div>
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
  const id = `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ?? ALL}
        onValueChange={(v) => onChange(v === ALL ? undefined : (v as T))}
      >
        <SelectTrigger id={id} className="mt-1 h-11 lg:h-9">
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
  const id = `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
        <SelectTrigger id={id} className="mt-1 h-11 lg:h-9">
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
