import { format, isValid, parseISO } from "date-fns";

const DASH = "—";
const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// parseISO reads a date-only "YYYY-MM-DD" as LOCAL midnight (new Date() would use UTC and could
// shift the day); full ISO timestamps keep their offset.
export function formatDate(iso: string | null): string {
  return iso ? format(parseISO(iso), "dd MMM yyyy") : DASH;
}

export function formatDateTime(iso: string | null): string {
  return iso ? format(parseISO(iso), "dd MMM yyyy, HH:mm") : DASH;
}

/** 1536 -> "1.5 KB". */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMoney(n: number | null): string {
  return n === null ? DASH : `SAR ${money.format(n)}`;
}

function localDay(date: string, h: number, m: number, s: number, ms: number): string | undefined {
  const d = date ? parseISO(date) : undefined;
  if (!d || !isValid(d)) return undefined;
  d.setHours(h, m, s, ms);
  return d.toISOString();
}

/** `YYYY-MM-DD` -> ISO of that local day at 00:00:00.000 (for "from" filters); undefined if empty. */
export const startOfDayISO = (date: string) => localDay(date, 0, 0, 0, 0);

/** `YYYY-MM-DD` -> ISO of that local day at 23:59:59.999 (the backend reads a bare date as midnight UTC); undefined if empty. */
export const endOfDayISO = (date: string) => localDay(date, 23, 59, 59, 999);

export function humanAge(hours: number): string {
  const h = Math.round(hours);
  return h < 24 ? `${h} h` : `${Math.round(hours / 24)} d`;
}

export function dueIn(iso: string): { text: string; overdue: boolean } {
  const hours = (Date.parse(iso) - Date.now()) / 3_600_000;
  const age = Math.abs(hours) < 1 ? "<1 h" : humanAge(Math.abs(hours));
  return hours < 0
    ? { text: `${age} overdue`, overdue: true }
    : { text: `in ${age}`, overdue: false };
}
