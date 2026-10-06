import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dueIn,
  endOfDayISO,
  formatDate,
  formatDateTime,
  formatMoney,
  humanAge,
  startOfDayISO,
} from "../format";

const TZ = process.env["TZ"];
afterEach(() => {
  vi.useRealTimers();
  if (TZ === undefined) delete process.env["TZ"];
  else process.env["TZ"] = TZ;
});

describe("format", () => {
  it("renders null as an em dash", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDateTime(null)).toBe("—");
    expect(formatMoney(null)).toBe("—");
  });

  it("formats dates as dd MMM yyyy", () => {
    expect(formatDate(new Date(2026, 2, 5, 14, 30).toISOString())).toBe("05 Mar 2026");
    expect(formatDateTime(new Date(2026, 2, 5, 14, 30).toISOString())).toBe("05 Mar 2026, 14:30");
  });

  it.each(["America/New_York", "Asia/Riyadh", "Pacific/Auckland"])(
    "keeps a date-only value on its calendar day (%s)",
    (tz) => {
      process.env["TZ"] = tz;
      expect(formatDate("2026-03-10")).toBe("10 Mar 2026");
    },
  );

  it("returns undefined for an empty day filter instead of throwing", () => {
    expect(startOfDayISO("")).toBeUndefined();
    expect(endOfDayISO("")).toBeUndefined();
  });

  it("formats money in SAR with thousands separators", () => {
    expect(formatMoney(1234567.5)).toBe("SAR 1,234,567.50");
    expect(formatMoney(0)).toBe("SAR 0.00");
  });

  it("end of day is 24h minus 1 ms after start of day (local)", () => {
    const start = Date.parse(startOfDayISO("2026-03-10")!);
    const end = Date.parse(endOfDayISO("2026-03-10")!);
    expect(end - start).toBe(24 * 60 * 60 * 1000 - 1);
    expect(new Date(start).getDate()).toBe(10);
    expect(new Date(end).getHours()).toBe(23);
    expect(new Date(end).getMilliseconds()).toBe(999);
  });

  it("shows ages in hours under a day and in days after", () => {
    expect(humanAge(5)).toBe("5 h");
    expect(humanAge(0)).toBe("0 h");
    expect(humanAge(72)).toBe("3 d");
    expect(humanAge(80)).toBe("3 d");
    expect(humanAge(23.6)).toBe("1 d");
    expect(humanAge(23.4)).toBe("23 h");
  });

  it("tells how long until a due date, or how overdue it is", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
    expect(dueIn("2026-03-13T12:00:00Z")).toEqual({ text: "in 3 d", overdue: false });
    expect(dueIn("2026-03-10T17:00:00Z")).toEqual({ text: "in 5 h", overdue: false });
    expect(dueIn("2026-03-08T12:00:00Z")).toEqual({ text: "2 d overdue", overdue: true });
    expect(dueIn("2026-03-10T12:20:00Z")).toEqual({ text: "in <1 h", overdue: false });
    expect(dueIn("2026-03-10T11:50:00Z")).toEqual({ text: "<1 h overdue", overdue: true });
  });
});
