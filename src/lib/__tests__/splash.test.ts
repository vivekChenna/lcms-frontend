import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hideSplash, hideSplashAfterMinimum } from "../splash";

function addSplash() {
  const el = document.createElement("div");
  el.id = "splash";
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = "";
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("hideSplash", () => {
  it("fades the splash out first, then removes it", () => {
    const el = addSplash();
    hideSplash();
    expect(el.classList.contains("splash-hide")).toBe(true);
    expect(document.getElementById("splash")).not.toBeNull();
    vi.advanceTimersByTime(500);
    expect(document.getElementById("splash")).toBeNull();
  });

  it("removes it straight away for people who asked for reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    addSplash();
    hideSplash();
    expect(document.getElementById("splash")).toBeNull();
  });

  it("does nothing when there is no splash", () => {
    expect(() => hideSplash()).not.toThrow();
  });
});

describe("hideSplashAfterMinimum", () => {
  it("keeps the splash up for the minimum time, even if the app is ready sooner", () => {
    vi.spyOn(performance, "now").mockReturnValue(100);
    const el = addSplash();
    hideSplashAfterMinimum(600);
    vi.advanceTimersByTime(400);
    expect(el.classList.contains("splash-hide")).toBe(false);
    vi.advanceTimersByTime(150);
    expect(el.classList.contains("splash-hide")).toBe(true);
  });

  it("hides at once when the app took longer than the minimum", () => {
    vi.spyOn(performance, "now").mockReturnValue(5000);
    const el = addSplash();
    hideSplashAfterMinimum(600);
    vi.advanceTimersByTime(0);
    expect(el.classList.contains("splash-hide")).toBe(true);
  });
});
