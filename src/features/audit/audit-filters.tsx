import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { apiJson } from "@/lib/api/client";
import type { UserListDto } from "@/lib/api/types";
import { dateRangeInvalid, type AuditFilters } from "./use-audit";

const ALL = "__all__";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  value: AuditFilters;
  onChange: (patch: Partial<AuditFilters>) => void;
  onClear: () => void;
};

/** `actorId`/`caseId` are the ids the backend filters on; the pickers below resolve a readable
 * name/reference to the id, then carry only the id in the URL (and as the request filter). */
export function AuditFiltersBar({ value, onChange, onClear }: Props) {
  const users = useQuery({
    queryKey: ["lookups", "all-users-for-audit"],
    queryFn: () => apiJson<UserListDto>("/users?pageSize=100"),
    staleTime: 5 * 60_000,
  });

  const [caseInput, setCaseInput] = useState(value.caseId ?? "");
  useEffect(() => setCaseInput(value.caseId ?? ""), [value.caseId]);

  useEffect(() => {
    if (!caseInput || caseInput === value.caseId) return;
    if (UUID_RE.test(caseInput)) {
      onChange({ caseId: caseInput });
      return;
    }
    const id = setTimeout(async () => {
      try {
        const page = await apiJson<{ items: { id: string; referenceNumber: string }[] }>(
          `/cases?search=${encodeURIComponent(caseInput)}&pageSize=5`,
        );
        const match = page.items[0];
        if (match) onChange({ caseId: match.id });
      } catch {
        // leave the filter unset; the input still shows what the user typed
      }
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseInput]);

  const invalidRange = dateRangeInvalid(value);
  const activeCount = Object.values(value).filter((v) => v !== undefined).length;

  return (
    <FilterSheet activeCount={activeCount} onClear={onClear}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="audit-action">Action</Label>
          <Input
            id="audit-action"
            className="mt-1 h-11 lg:h-9"
            placeholder="e.g. case.closed"
            value={value.action ?? ""}
            onChange={(e) => onChange({ action: e.target.value || undefined })}
          />
        </div>

        <div>
          <Label htmlFor="audit-actor">Actor</Label>
          <Select
            value={value.actorId ?? ALL}
            onValueChange={(v) => onChange({ actorId: v === ALL ? undefined : v })}
          >
            <SelectTrigger id="audit-actor" className="mt-1 h-11 lg:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {users.data?.items.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="audit-case">Case reference or ID</Label>
          <Input
            id="audit-case"
            className="mt-1 h-11 lg:h-9"
            placeholder="AGC-INT-000012"
            value={caseInput}
            onChange={(e) => {
              setCaseInput(e.target.value);
              if (!e.target.value) onChange({ caseId: undefined });
            }}
          />
        </div>

        <div>
          <Label htmlFor="audit-from">Created from</Label>
          <Input
            id="audit-from"
            type="date"
            className="mt-1 h-11 lg:h-9"
            value={value.createdFrom ?? ""}
            onChange={(e) => onChange({ createdFrom: e.target.value || undefined })}
          />
        </div>
        <div>
          <Label htmlFor="audit-to">Created to</Label>
          <Input
            id="audit-to"
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
