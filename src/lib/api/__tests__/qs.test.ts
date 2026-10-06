import { describe, expect, it } from "vitest";
import { qs } from "../qs";

describe("qs", () => {
  it("skips empty values and encodes the rest", () => {
    expect(qs({ a: 1, b: "", c: undefined, d: "x y" })).toBe("?a=1&d=x%20y");
  });
  it("returns an empty string when nothing remains", () => {
    expect(qs({ a: undefined, b: null, c: "" })).toBe("");
  });
  it("keeps false and 0", () => {
    expect(qs({ a: false, b: 0 })).toBe("?a=false&b=0");
  });
});
