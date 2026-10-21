import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEADLINE_NOT_AFTER_INCIDENT,
  INCIDENT_DATE_FUTURE,
  dayAfter,
  intakeDateIssues,
  localToday,
  todayIn,
  userTimeZone,
} from "../dates";

afterEach(() => vi.restoreAllMocks());

describe("todayIn", () => {
  it("is the calendar date in the given zone, not the UTC date", () => {
    const instant = new Date("2026-10-19T22:30:00Z");
    expect(todayIn("UTC", instant)).toBe("2026-10-19");
    expect(todayIn("Asia/Riyadh", instant)).toBe("2026-10-20");
    expect(todayIn("Asia/Kolkata", instant)).toBe("2026-10-20");
    expect(todayIn("America/New_York", instant)).toBe("2026-10-19");
  });
});

describe("userTimeZone and localToday", () => {
  it("follow the browser's zone", () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      timeZone: "Asia/Kolkata",
    } as Intl.ResolvedDateTimeFormatOptions);
    expect(userTimeZone()).toBe("Asia/Kolkata");
    expect(localToday(new Date("2026-10-19T22:30:00Z"))).toBe("2026-10-20");
  });

  it("falls back to UTC when the browser cannot say", () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      timeZone: "",
    } as Intl.ResolvedDateTimeFormatOptions);
    expect(userTimeZone()).toBe("UTC");
  });
});

describe("dayAfter", () => {
  it("rolls over month and year ends", () => {
    expect(dayAfter("2026-10-31")).toBe("2026-11-01");
    expect(dayAfter("2026-12-31")).toBe("2027-01-01");
  });
});

describe("intakeDateIssues", () => {
  const today = "2026-10-20";
  it("accepts a past or current incident with a later deadline", () => {
    expect(intakeDateIssues("2026-10-20", "2026-10-21", today)).toEqual({});
    expect(intakeDateIssues("2026-01-01", "2026-12-31", today)).toEqual({});
  });
  it("flags an incident in the future", () => {
    expect(intakeDateIssues("2026-10-21", "2026-12-31", today).incidentDate).toBe(
      INCIDENT_DATE_FUTURE,
    );
  });
  it("flags a deadline on or before the incident", () => {
    expect(intakeDateIssues("2026-05-01", "2026-05-01", today).businessDeadline).toBe(
      DEADLINE_NOT_AFTER_INCIDENT,
    );
    expect(intakeDateIssues("2026-05-02", "2026-05-01", today).businessDeadline).toBe(
      DEADLINE_NOT_AFTER_INCIDENT,
    );
  });
  it("says nothing about a blank field (the required rule reports that)", () => {
    expect(intakeDateIssues("", "", today)).toEqual({});
    expect(intakeDateIssues("2026-05-01", "", today)).toEqual({});
  });
});
