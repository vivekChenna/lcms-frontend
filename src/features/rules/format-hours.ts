/** 4 -> "4 hours", 72 -> "3 days": whole days read better once the target is two days or more. */
export function formatHours(hours: number): string {
  if (hours >= 48 && hours % 24 === 0) return `${hours / 24} days`;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}
