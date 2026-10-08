import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { apiJson } from "@/lib/api/client";
import type { UserListDto } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { roleLabel } from "@/lib/labels";
import {
  useBusinessUnits,
  useCaseTypes,
  useCategories,
  useClosureOutcomes,
  useDepartments,
  useEntities,
} from "@/lib/queries/lookups";
import type { AuditRow } from "@/features/case-detail/audit/describe";
import { summariseChanges, type NameResolver } from "./change-summary";

type Named = { id: string; name: string };

// fields that hold a user id; everything else that ends in "Id" is a lookup list or stays hidden
const USER_KEYS = new Set([
  "assignedLegalRepId",
  "targetLegalRepId",
  "previousLegalRepId",
  "responderId",
  "requesterId",
  "actorId",
  "userId",
]);

function useNameResolver(): { resolve: NameResolver; ready: boolean } {
  const categories = useCategories();
  const caseTypes = useCaseTypes();
  const departments = useDepartments();
  const entities = useEntities();
  const businessUnits = useBusinessUnits();
  const outcomes = useClosureOutcomes();
  // the same list the audit filters use, so it is usually already cached
  const users = useQuery({
    queryKey: ["lookups", "all-users-for-audit"],
    queryFn: () => apiJson<UserListDto>("/users?pageSize=100"),
    staleTime: 5 * 60_000,
  });

  const lists: Record<string, readonly Named[] | undefined> = {
    categoryId: categories.data,
    caseTypeId: caseTypes.data,
    departmentId: departments.data,
    entityId: entities.data,
    businessUnitId: businessUnits.data,
    closureOutcomeId: outcomes.data,
  };
  const resolve: NameResolver = (key, value) => {
    if (USER_KEYS.has(key)) return users.data?.items.find((u) => u.id === value)?.fullName;
    return lists[key]?.find((item) => item.id === value)?.name;
  };
  // a lookup that failed is settled too: its ids are simply left out rather than blocking the dialog
  const ready = [
    categories,
    caseTypes,
    departments,
    entities,
    businessUnits,
    outcomes,
    users,
  ].every((q) => !q.isPending);
  return { resolve, ready };
}

/**
 * One audit entry in plain language: who, when, what, and the change itself as "Status: Submitted
 * to Assigned". The raw before/after data stays available under "Technical details" for support.
 */
export function AuditDetails({ row, summary }: { row: AuditRow; summary: string }) {
  const { resolve, ready } = useNameResolver();
  const changes = summariseChanges(row.beforeValue, row.afterValue, resolve);

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-[5rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Who</dt>
        <dd>
          <span className="font-medium">{row.actorName ?? "System"}</span>
          {row.actorRole && (
            <span className="text-muted-foreground"> ({roleLabel(row.actorRole)})</span>
          )}
        </dd>
        <dt className="text-muted-foreground">When</dt>
        <dd>{formatDateTime(row.createdAt)}</dd>
        <dt className="text-muted-foreground">What</dt>
        <dd>{summary}</dd>
        {row.caseReference && (
          <>
            <dt className="text-muted-foreground">Case</dt>
            <dd>{row.caseReference}</dd>
          </>
        )}
      </dl>

      <section>
        <h3 className="mb-2 text-sm font-semibold">
          {changes.kind === "recorded" ? "Details recorded" : "What changed"}
        </h3>
        {!ready ? (
          <p
            role="status"
            aria-label="Loading details"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Spinner />
            Loading details…
          </p>
        ) : changes.kind === "empty" ? (
          <p className="text-sm text-muted-foreground">
            No further details were recorded for this action.
          </p>
        ) : (
          <ul
            aria-label={changes.kind === "recorded" ? "Details recorded" : "What changed"}
            className="divide-y rounded-lg border"
          >
            {changes.rows.map((r) => (
              <li
                key={r.key}
                className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-[10rem_1fr] sm:gap-4"
              >
                <span className="text-muted-foreground">{r.label}</span>
                {r.before === null ? (
                  <span className="min-w-0 whitespace-pre-wrap break-words font-medium">
                    {r.after}
                  </span>
                ) : (
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                      {r.before}
                    </span>
                    <ArrowRight
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-label="changed to"
                    />
                    <span className="font-medium">{r.after}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Technical details
        </summary>
        <div className="mt-2 space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Before</p>
            <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(row.beforeValue, null, 2) ?? "null"}
            </pre>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">After</p>
            <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(row.afterValue, null, 2) ?? "null"}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}
