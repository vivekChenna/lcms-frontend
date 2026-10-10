import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hideSplash, isSplashShown, showSplash } from "../splash";

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="splash"></div>';
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("splash", () => {
  it("is shown to begin with", () => {
    expect(isSplashShown()).toBe(true);
  });

  it("fades out first, then is parked rather than removed", () => {
    const el = document.getElementById("splash")!;
    hideSplash();
    expect(el.classList.contains("splash-hide")).toBe(true);
    expect(isSplashShown()).toBe(false);
    expect(el.style.display).not.toBe("none");
    vi.advanceTimersByTime(600);
    expect(el.style.display).toBe("none");
    expect(document.getElementById("splash")).not.toBeNull();
  });

  it("can be shown again after it has been hidden", () => {
    const el = document.getElementById("splash")!;
    hideSplash();
    vi.advanceTimersByTime(600);
    showSplash();
    expect(el.style.display).toBe("");
    expect(el.classList.contains("splash-hide")).toBe(false);
    expect(isSplashShown()).toBe(true);
  });

  it("showing it during the fade-out cancels the pending park", () => {
    const el = document.getElementById("splash")!;
    hideSplash();
    vi.advanceTimersByTime(200);
    showSplash();
    vi.advanceTimersByTime(600);
    expect(el.style.display).not.toBe("none");
    expect(isSplashShown()).toBe(true);
  });

  it("parks it straight away for people who asked for reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    hideSplash();
    expect(document.getElementById("splash")!.style.display).toBe("none");
  });

  it("does nothing when the page has no splash", () => {
    document.body.innerHTML = "";
    expect(() => {
      hideSplash();
      showSplash();
    }).not.toThrow();
    expect(isSplashShown()).toBe(false);
  });
});
