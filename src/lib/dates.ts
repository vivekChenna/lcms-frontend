// People use LCMS from different countries, so "today" for a date rule is the date where the user is. The
// browser knows its IANA time zone (for example "Asia/Kolkata"); it is also sent to the backend with every
// request (see api/client.ts) so the server judges the same dates the same way.

/** The browser's IANA time zone name, or "UTC" when it cannot say. */
export function userTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Today's date in `timeZone` as "YYYY-MM-DD". */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Today's date where the user is, as "YYYY-MM-DD". */
export function localToday(now: Date = new Date()): string {
  return todayIn(userTimeZone(), now);
}

/** The day after a "YYYY-MM-DD" date, as "YYYY-MM-DD". */
export function dayAfter(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export const INCIDENT_DATE_FUTURE = "Incident date cannot be in the future";
export const DEADLINE_NOT_AFTER_INCIDENT = "Business deadline must be after the incident date";

/** The rules shared by the new-request and edit-case forms (and enforced again by the backend). */
export function intakeDateIssues(
  incidentDate: string,
  businessDeadline: string,
  today: string = localToday(),
): { incidentDate?: string; businessDeadline?: string } {
  const issues: { incidentDate?: string; businessDeadline?: string } = {};
  if (incidentDate && incidentDate > today) issues.incidentDate = INCIDENT_DATE_FUTURE;
  if (incidentDate && businessDeadline && businessDeadline <= incidentDate) {
    issues.businessDeadline = DEADLINE_NOT_AFTER_INCIDENT;
  }
  return issues;
}
