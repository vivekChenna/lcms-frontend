import { format } from "date-fns";

const DASH = "—";
const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatDate(iso: string | null): string {
  return iso ? format(new Date(iso), "dd MMM yyyy") : DASH;
}

export function formatDateTime(iso: string | null): string {
  return iso ? format(new Date(iso), "dd MMM yyyy, HH:mm") : DASH;
}

export function formatMoney(n: number | null): string {
  return n === null ? DASH : `SAR ${money.format(n)}`;
}

function localDay(date: string, h: number, m: number, s: number, ms: number): string {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(y!, mo! - 1, d!, h, m, s, ms).toISOString();
}

/** `YYYY-MM-DD` -> ISO of that local day at 00:00:00.000 (for "from" filters). */
export const startOfDayISO = (date: string) => localDay(date, 0, 0, 0, 0);

/** `YYYY-MM-DD` -> ISO of that local day at 23:59:59.999; the backend reads a bare date as midnight UTC. */
export const endOfDayISO = (date: string) => localDay(date, 23, 59, 59, 999);

export function humanAge(hours: number): string {
  return hours < 24 ? `${Math.round(hours)} h` : `${Math.floor(hours / 24)} d`;
}

export function dueIn(iso: string): { text: string; overdue: boolean } {
  const hours = (Date.parse(iso) - Date.now()) / 3_600_000;
  return hours < 0
    ? { text: `${humanAge(-hours)} overdue`, overdue: true }
    : { text: `in ${humanAge(hours)}`, overdue: false };
}
