import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isSplashShown, showSplash } from "@/lib/splash";
import { MAX_VISIBLE_MS, MIN_VISIBLE_MS, SETTLE_MS, useSplashGate } from "../use-splash-gate";

let now = 0;

beforeEach(() => {
  vi.useFakeTimers();
  now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  document.body.innerHTML = '<div id="splash"></div>';
});
afterEach(() => {
  // unmount earlier hooks: they are subscribed to the splash and would keep acting on it
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const advance = (ms: number) =>
  act(() => {
    now += ms;
    vi.advanceTimersByTime(ms);
  });

describe("useSplashGate", () => {
  it("keeps the splash up for as long as the app is still loading", () => {
    renderHook(() => useSplashGate(true));
    advance(8000);
    expect(isSplashShown()).toBe(true);
  });

  it("fades it out once loading has been quiet for the settle time", () => {
    now = 5000; // the app was slow, so the minimum time has long passed
    renderHook(() => useSplashGate(false));
    advance(SETTLE_MS - 50);
    expect(isSplashShown()).toBe(true);
    advance(100);
    expect(isSplashShown()).toBe(false);
  });

  it("holds it for the minimum time even when the app is ready at once", () => {
    now = 100;
    renderHook(() => useSplashGate(false));
    advance(MIN_VISIBLE_MS - 200);
    expect(isSplashShown()).toBe(true);
    advance(300);
    expect(isSplashShown()).toBe(false);
  });

  it("starts the quiet period over if something begins loading again", () => {
    now = 5000;
    const { rerender } = renderHook(({ busy }) => useSplashGate(busy), {
      initialProps: { busy: false },
    });
    advance(SETTLE_MS - 100);
    rerender({ busy: true });
    advance(1000);
    expect(isSplashShown()).toBe(true);
    rerender({ busy: false });
    advance(SETTLE_MS + 50);
    expect(isSplashShown()).toBe(false);
  });

  it("gives up waiting after the maximum time, so the app is never covered for good", () => {
    renderHook(() => useSplashGate(true));
    advance(MAX_VISIBLE_MS + 100);
    expect(isSplashShown()).toBe(false);
  });

  it("covers the screen again, and waits again, when shown after sign-in", () => {
    now = 5000;
    const { rerender } = renderHook(({ busy }) => useSplashGate(busy), {
      initialProps: { busy: false },
    });
    advance(SETTLE_MS + 50);
    expect(isSplashShown()).toBe(false);

    act(() => showSplash());
    expect(isSplashShown()).toBe(true);
    rerender({ busy: true });
    advance(3000);
    expect(isSplashShown()).toBe(true);
    rerender({ busy: false });
    advance(MIN_VISIBLE_MS + 100);
    expect(isSplashShown()).toBe(false);
  });
});
