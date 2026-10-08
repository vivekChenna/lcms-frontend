import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** shadcn's Select cannot hold an empty-string item value, so "no filter" gets its own token. */
const ALL = "__all__";

type Option = { value: string; label: string };

/**
 * A compact filter control for a toolbar: shows just its name until a value is chosen, then
 * "Name  Value" with a tinted border so active filters are visible at a glance.
 */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string | undefined;
  options: Option[];
  onChange: (value: string | undefined) => void;
  className?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-10 w-auto min-w-28 gap-2 rounded-lg bg-card",
          current && "border-primary/40 bg-primary/5",
          className,
        )}
      >
        <span className="truncate">
          <span className={current ? "text-muted-foreground" : ""}>{label}</span>
          {current && <span className="ml-1.5 font-medium">{current.label}</span>}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
