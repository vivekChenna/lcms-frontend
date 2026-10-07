import { describe, expect, it } from "vitest";

// Built from character fragments so this file's own source text never contains the literal
// forbidden strings - which would otherwise make it fail its own check.
const FORBIDDEN = [
  "@flu" + "entui",
  "lcms-d" + "ata",
  "lcms-cont" + "ext",
  "lcms-a" + "pi",
  "demo" + "Users",
  "session" + "Storage",
  "Author" + "ization",
];

describe("no-legacy", () => {
  it("no source file references the retired demo shell, Fluent UI, or token storage", () => {
    const modules = import.meta.glob("/src/**/*.{ts,tsx}", {
      query: "?raw",
      eager: true,
    }) as Record<string, { default: string }>;
    const selfPath = import.meta.url.includes("no-legacy.test")
      ? Object.keys(modules).find((p) => p.endsWith("no-legacy.test.ts"))
      : undefined;

    const offenders: string[] = [];
    for (const [path, mod] of Object.entries(modules)) {
      if (path === selfPath) continue;
      const source = mod.default;
      for (const needle of FORBIDDEN) {
        if (source.includes(needle)) offenders.push(`${path}: "${needle}"`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
