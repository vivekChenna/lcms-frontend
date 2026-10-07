import { describe, expect, it } from "vitest";
import { ApiError, fieldErrors, isNetworkError } from "../errors";

describe("isNetworkError", () => {
  it("is true for a fetch-level TypeError", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new TypeError("NetworkError when attempting to fetch resource."))).toBe(
      true,
    );
    expect(isNetworkError(new TypeError("Load failed"))).toBe(true);
  });

  it("is false for an ApiError (a real 4xx/5xx response)", () => {
    expect(isNetworkError(new ApiError(500, "INTERNAL", "Something broke"))).toBe(false);
  });

  it("is false for an unrelated TypeError or non-error value", () => {
    expect(isNetworkError(new TypeError("Cannot read properties of undefined"))).toBe(false);
    expect(isNetworkError("just a string")).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});

describe("fieldErrors", () => {
  it("returns the details of an ApiError that has them", () => {
    expect(fieldErrors(new ApiError(400, "VALIDATION", "Invalid", { email: "Required" }))).toEqual({
      email: "Required",
    });
  });

  it("returns an empty object otherwise", () => {
    expect(fieldErrors(new ApiError(500, "INTERNAL", "Oops"))).toEqual({});
    expect(fieldErrors(new Error("plain"))).toEqual({});
  });
});
