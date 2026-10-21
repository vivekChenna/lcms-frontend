import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/lib/countries";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

/** A searchable "Country" picker (flag + name, type to filter) over the full country list, for
 * when a plain dropdown would mean scrolling through all ~250 of them by hand. */
export function CountryCombobox({ id, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const selected = COUNTRIES.find((c) => c.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="mt-1 h-11 w-full justify-between font-normal lg:h-9"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <selected.Flag
                aria-hidden
                title={selected.label}
                className="h-3.5 w-5 shrink-0 rounded-[2px]"
              />
              <span className="truncate">{selected.label}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select a country</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search countries…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((c) => (
                <CommandItem
                  key={c.value}
                  value={c.label}
                  onSelect={() => {
                    onChange(c.value);
                    setOpen(false);
                  }}
                >
                  <c.Flag
                    aria-hidden
                    title={c.label}
                    className="h-3.5 w-5 shrink-0 rounded-[2px]"
                  />
                  {c.label}
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      c.value === value ? "opacity-100" : "opacity-0",
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
  );
}
