import { X } from "lucide-react";
import { useMe } from "@/lib/auth";
import { PRIORITY_LABEL, SLA_LABEL } from "@/lib/labels";
import {
  useBusinessUnits,
  useCaseTypes,
  useCategories,
  useDepartments,
  useEntities,
  useCaseHolders,
} from "@/lib/queries/lookups";
import type { CasesSearch } from "./search-params";

type Chip = { key: string; label: string; clear: Partial<CasesSearch> };

const nameOf = (items: { id: string; name: string }[] | undefined, id: string) =>
  items?.find((i) => i.id === id)?.name ?? "…";

/** One removable chip per active filter, so a tile or chart click visibly "lands" on a filtered list. */
export function ActiveFilters({
  value,
  onRemove,
  exclude = [],
}: {
  value: CasesSearch;
  onRemove: (patch: Partial<CasesSearch>) => void;
  /** Chip keys not to show, for filters already visible as controls (e.g. "status"). */
  exclude?: string[];
}) {
  const me = useMe();
  const categories = useCategories();
  const caseTypes = useCaseTypes();
  const departments = useDepartments();
  const entities = useEntities();
  const businessUnits = useBusinessUnits();
  const legalReps = useCaseHolders();

  const chips: Chip[] = [];
  if (value.status)
    chips.push({ key: "status", label: `Status: ${value.status}`, clear: { status: undefined } });
  if (value.priority)
    chips.push({
      key: "priority",
      label: `Priority: ${PRIORITY_LABEL[value.priority]}`,
      clear: { priority: undefined },
    });
  if (value.slaState)
    chips.push({
      key: "sla",
      label: `SLA: ${SLA_LABEL[value.slaState]}`,
      clear: { slaState: undefined },
    });
  if (value.open) chips.push({ key: "open", label: "Open only", clear: { open: undefined } });
  if (value.search)
    chips.push({ key: "search", label: `Search: “${value.search}”`, clear: { search: undefined } });
  if (value.categoryId)
    chips.push({
      key: "category",
      label: `Category: ${nameOf(categories.data, value.categoryId)}`,
      clear: { categoryId: undefined, caseTypeId: undefined },
    });
  if (value.caseTypeId)
    chips.push({
      key: "caseType",
      label: `Case type: ${nameOf(caseTypes.data, value.caseTypeId)}`,
      clear: { caseTypeId: undefined },
    });
  if (value.departmentId)
    chips.push({
      key: "department",
      label: `Department: ${nameOf(departments.data, value.departmentId)}`,
      clear: { departmentId: undefined },
    });
  if (value.entityId)
    chips.push({
      key: "entity",
      label: `Entity: ${nameOf(entities.data, value.entityId)}`,
      clear: { entityId: undefined, businessUnitId: undefined },
    });
  if (value.businessUnitId)
    chips.push({
      key: "businessUnit",
      label: `Business unit: ${nameOf(businessUnits.data, value.businessUnitId)}`,
      clear: { businessUnitId: undefined },
    });
  if (value.assignedLegalRepId) {
    const mine = value.assignedLegalRepId === me?.id;
    chips.push({
      key: "assignee",
      label: mine
        ? "Assigned to me"
        : `Assigned to: ${nameOf(
            legalReps.data?.map((r) => ({ id: r.id, name: r.fullName })),
            value.assignedLegalRepId,
          )}`,
      clear: { assignedLegalRepId: undefined },
    });
  }

  const shown = chips.filter((c) => !exclude.includes(c.key));
  if (shown.length === 0) return null;

  return (
    <ul aria-label="Active filters" className="flex flex-wrap gap-2">
      {shown.map((c) => (
        <li key={c.key}>
          <button
            type="button"
            onClick={() => onRemove(c.clear)}
            aria-label={`Remove filter ${c.label}`}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border bg-muted px-3 text-sm hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring"
          >
            {c.label}
            <X className="size-3.5" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
