import * as Flags from "country-flag-icons/react/3x2";
import { countries as COUNTRY_CODES } from "country-flag-icons";

type FlagComponent = (props: {
  title?: string;
  className?: string;
  "aria-hidden"?: boolean;
}) => React.JSX.Element;

const REGION_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string): string {
  try {
    return REGION_NAMES.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Every country `country-flag-icons` has a flag for (not just Saudi Arabia and India), sorted by
 * name. Names come from the standard `Intl.DisplayNames` API rather than a second data package. */
export const COUNTRIES = COUNTRY_CODES.map((value) => ({
  value,
  label: countryName(value),
  Flag: (Flags as Record<string, FlagComponent>)[value],
}))
  .filter((c): c is { value: string; label: string; Flag: FlagComponent } => !!c.Flag)
  .sort((a, b) => a.label.localeCompare(b.label));

export type CountryCode = string;

const BY_CODE = new Map(COUNTRIES.map((c) => [c.value, c]));

export function isCountryCode(code: string): boolean {
  return BY_CODE.has(code);
}

/** The flag + label for a country code, e.g. inside a dropdown item. Falls back to the code itself
 * for anything not recognized, so an unexpected value never crashes the page. */
export function CountryLabel({ code }: { code: string }) {
  const country = BY_CODE.get(code);
  if (!country) return <span>{code}</span>;
  const { Flag, label } = country;
  return (
    <span className="flex items-center gap-2">
      {/* aria-hidden: its embedded <title> would otherwise double up with the text right after it */}
      <Flag aria-hidden title={label} className="h-3.5 w-5 shrink-0 rounded-[2px]" />
      {label}
    </span>
  );
}
