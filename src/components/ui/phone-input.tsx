import * as React from "react";
import RPNInput, { isSupportedCountry, type Country } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export { isValidPhoneNumber } from "react-phone-number-input";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Which country's dial code to pre-select while the number is still empty, e.g. kept in sync
   * with a "Country" field elsewhere in the same form. Falls back to Saudi Arabia for a code this
   * library has no calling-code data for (not every ISO territory has one, e.g. Antarctica). */
  defaultCountry?: string;
};

const PhoneNumberField = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn(
        "h-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0",
        className,
      )}
      {...props}
    />
  ),
);
PhoneNumberField.displayName = "PhoneNumberField";

type CountryOption = { value?: string; label: string; divider?: boolean };
// This is react-phone-number-input's own `iconComponent` (built internally from the `flags` prop
// passed to RPNInput): its prop is named `label`, not `countryName` - that name belongs to the
// inner flag component it wraps, one layer down, which `label` gets forwarded to.
type FlagIcon = React.ComponentType<{
  country: string;
  label: string;
  "aria-hidden"?: boolean;
}>;

/** A themed Radix dropdown in place of the library's own native `<select/>`, whose popup list
 * Chromium won't let page CSS restyle (it was showing up unthemed - wrong background/text color
 * in dark mode, and looking like a bare browser control instead of the rest of this app's UI). */
function CountrySelect({
  value,
  onChange,
  options,
  disabled,
  iconComponent: Icon,
}: {
  value?: string;
  onChange: (value?: string) => void;
  options: CountryOption[];
  disabled?: boolean;
  iconComponent?: FlagIcon;
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <Select
      value={value ?? "ZZ"}
      onValueChange={(v) => onChange(v === "ZZ" ? undefined : v)}
      {...(disabled !== undefined ? { disabled } : {})}
    >
      <SelectTrigger
        aria-label="Phone number country"
        className="h-full w-auto shrink-0 gap-1 border-0 bg-transparent px-1 py-0 shadow-none focus:ring-0"
      >
        <SelectValue>
          {value && Icon && <Icon aria-hidden country={value} label={selected?.label ?? value} />}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options
          .filter((o) => !o.divider)
          .map((o) => (
            <SelectItem key={o.value ?? "ZZ"} value={o.value ?? "ZZ"}>
              <span className="flex items-center gap-2">
                {o.value && Icon && <Icon aria-hidden country={o.value} label={o.label} />}
                {o.label}
              </span>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

/** Every country's dial code (via libphonenumber-js), not just SA/IN - unrelated to the per-user
 * `country` field that drives timezone resolution, though a caller may still choose to pass that
 * same value as `defaultCountry` to keep the two in sync. Defaults to Saudi Arabia. */
function PhoneInput({ className, onChange, disabled, defaultCountry, ...props }: Props) {
  const country: Country =
    defaultCountry && isSupportedCountry(defaultCountry) ? defaultCountry : "SA";
  return (
    <RPNInput
      // remounts when the pre-selected country changes, so an empty field picks up the new dial
      // code; a number already being typed keeps its own country, inferred from its digits
      key={country}
      {...props}
      {...(disabled !== undefined ? { disabled } : {})}
      international
      defaultCountry={country}
      flags={flags}
      inputComponent={PhoneNumberField}
      countrySelectComponent={CountrySelect}
      className={cn(
        "flex h-11 items-center gap-2 rounded-md border border-input bg-transparent px-3 shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring lg:h-9",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onChange={(value) => onChange(value ?? "")}
    />
  );
}

export { PhoneInput };
