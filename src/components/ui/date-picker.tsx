import { useState } from "react";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ISO = "yyyy-MM-dd";

type Props = {
  id: string;
  /** "YYYY-MM-DD", or "" for no date. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean | undefined;
  "aria-describedby"?: string | undefined;
};

function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, ISO, new Date());
  return isValid(d) ? d : undefined;
}

/** shadcn date field: a button that opens a calendar. Values are plain "YYYY-MM-DD" strings. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  ...aria
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);

  const choose = (d: Date | undefined) => {
    onChange(d ? format(d, ISO) : "");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={aria["aria-invalid"]}
          aria-describedby={aria["aria-describedby"]}
          className={cn(
            "mt-1 h-11 w-full justify-start gap-2 px-3 text-left font-normal lg:h-9",
            !selected && "text-muted-foreground",
            aria["aria-invalid"] && "border-danger",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" aria-hidden />
          <span className="truncate">
            {selected ? format(selected, "dd MMM yyyy") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          {...(selected ? { defaultMonth: selected } : {})}
          onSelect={choose}
          captionLayout="dropdown"
          startMonth={new Date(2000, 0)}
          endMonth={new Date(2100, 11)}
          autoFocus
        />
        <div className="flex items-center justify-between border-t px-3 py-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => choose(undefined)}>
            Clear
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => choose(new Date())}>
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
