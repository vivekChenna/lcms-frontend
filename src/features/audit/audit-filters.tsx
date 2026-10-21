import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterSheet } from "@/components/common/filter-sheet";
import { SearchInput } from "@/components/common/search-input";
import { useDebouncedField } from "@/hooks/use-debounced-field";
import { apiJson } from "@/lib/api/client";
import type { UserListDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { dateRangeInvalid, type AuditFilters } from "./use-audit";

const ALL = "__all__";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CaseOption = { id: string; referenceNumber: string; title: string };

type Props = {
  value: AuditFilters;
  onChange: (patch: Partial<AuditFilters>) => void;
  onClear: () => void;
  /** A filter request is in flight (shows the spinner in the Action box). */
  loading?: boolean | undefined;
};

/** `actorId`/`caseId` are the ids the backend filters on; the pickers below resolve a readable
 * name/reference to the id, then carry only the id in the URL (and as the request filter). */
export function AuditFiltersBar({ value, onChange, onClear, loading }: Props) {
  // typing an action filters only after a pause, not once per keystroke
  const {
    text: actionText,
    setText: setActionText,
    waiting: actionWaiting,
  } = useDebouncedField(value.action ?? "", (v) => onChange({ action: v || undefined }));

  const users = useQuery({
    queryKey: ["lookups", "all-users-for-audit"],
    queryFn: () => apiJson<UserListDto>("/users?pageSize=100"),
    staleTime: 5 * 60_000,
  });

  const [caseOpen, setCaseOpen] = useState(false);
  const [caseLabel, setCaseLabel] = useState(value.caseId ?? "");
  // only reset the box back to empty when the filter is cleared from elsewhere (e.g. "Clear
  // filters") - not on every value change, or picking a case would overwrite its own label
  useEffect(() => {
    if (!value.caseId) setCaseLabel("");
  }, [value.caseId]);

  const [caseQuery, setCaseQuery] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setCaseQuery(caseLabel), 300);
    return () => clearTimeout(id);
  }, [caseLabel]);

  // no `enabled` gate on an empty query: opening the box shows the full case list, not nothing
  const caseResults = useQuery({
    queryKey: ["cases", "picker", caseQuery],
    queryFn: () =>
      apiJson<{ items: CaseOption[] }>(
        `/cases?search=${encodeURIComponent(caseQuery)}&pageSize=10`,
      ),
    enabled: !UUID_RE.test(caseQuery),
    staleTime: 30_000,
  });

  const pickCase = (c: CaseOption) => {
    setCaseLabel(c.referenceNumber);
    onChange({ caseId: c.id });
    setCaseOpen(false);
  };

  const invalidRange = dateRangeInvalid(value);
  const activeCount = Object.values(value).filter((v) => v !== undefined).length;

  return (
    <FilterSheet activeCount={activeCount} onClear={onClear}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="audit-action">Action</Label>
          <SearchInput
            id="audit-action"
            className="mt-1 h-11 lg:h-9"
            placeholder="e.g. case.closed"
            value={actionText}
            busy={actionWaiting || loading}
            onChange={(e) => setActionText(e.target.value)}
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
          <Popover open={caseOpen} onOpenChange={setCaseOpen}>
            <PopoverTrigger asChild>
              <Button
                id="audit-case"
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={caseOpen}
                className="mt-1 h-11 w-full justify-between font-normal lg:h-9"
              >
                <span className="truncate">{caseLabel || "Any case"}</span>
                <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search by reference or title…"
                  value={caseLabel}
                  onValueChange={(v) => {
                    setCaseLabel(v);
                    if (!v) onChange({ caseId: undefined });
                    else if (UUID_RE.test(v)) onChange({ caseId: v });
                  }}
                />
                <CommandList>
                  {caseResults.isFetching ? (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      Searching…
                    </div>
                  ) : (
                    <CommandEmpty>No case found.</CommandEmpty>
                  )}
                  <CommandGroup>
                    {(caseResults.data?.items ?? []).map((c) => (
                      <CommandItem key={c.id} value={c.id} onSelect={() => pickCase(c)}>
                        <span className="flex min-w-0 flex-col">
                          <span className="font-medium">{c.referenceNumber}</span>
                          <span className="truncate text-xs text-muted-foreground">{c.title}</span>
                        </span>
                        <Check
                          className={cn(
                            "ml-auto size-4",
                            c.id === value.caseId ? "opacity-100" : "opacity-0",
                          )}
                          aria-hidden
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="audit-from">Created from</Label>
          <DatePicker
            id="audit-from"
            value={value.createdFrom ?? ""}
            onChange={(v) => onChange({ createdFrom: v || undefined })}
            max={value.createdTo}
            aria-invalid={invalidRange || undefined}
          />
        </div>
        <div>
          <Label htmlFor="audit-to">Created to</Label>
          <DatePicker
            id="audit-to"
            value={value.createdTo ?? ""}
            onChange={(v) => onChange({ createdTo: v || undefined })}
            min={value.createdFrom}
            aria-invalid={invalidRange || undefined}
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
