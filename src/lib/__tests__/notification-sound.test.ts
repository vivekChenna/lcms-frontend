import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isSoundEnabled,
  isSoundFeatureOn,
  playNotificationSound,
  setSoundEnabled,
} from "../notification-sound";

beforeEach(() => {
  window.localStorage.clear();
  vi.stubEnv("VITE_NOTIFICATION_SOUND", "true");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("the feature switch (VITE_NOTIFICATION_SOUND)", () => {
  it("is off unless the setting is exactly true", () => {
    for (const value of [undefined, "", "false", "1", "yes", "TRUE"]) {
      vi.stubEnv("VITE_NOTIFICATION_SOUND", value as string);
      expect(isSoundFeatureOn()).toBe(false);
      expect(isSoundEnabled()).toBe(false);
    }
    vi.stubEnv("VITE_NOTIFICATION_SOUND", "true");
    expect(isSoundFeatureOn()).toBe(true);
  });

  it("keeps everything silent when off, whatever the person chose", () => {
    vi.stubEnv("VITE_NOTIFICATION_SOUND", "false");
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(false);
  });
});

describe("notification sound preference", () => {
  it("is on until someone turns it off, and remembers the choice", () => {
    expect(isSoundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });

  it("still works when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(isSoundEnabled()).toBe(true);
  });
});

describe("playNotificationSound", () => {
  it("does nothing, and does not throw, where the browser has no audio support", () => {
    vi.stubGlobal("AudioContext", undefined);
    expect(() => playNotificationSound()).not.toThrow();
  });

  it("plays two short tones through the browser's audio engine", () => {
    const start = vi.fn();
    const osc = () => ({
      type: "",
      frequency: { value: 0 },
      connect: vi.fn(),
      start,
      stop: vi.fn(),
    });
    const gain = () => ({
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    });
    class FakeAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator = osc;
      createGain = gain;
      resume = vi.fn();
    }
    vi.stubGlobal("AudioContext", FakeAudioContext);
    playNotificationSound();
    expect(start).toHaveBeenCalledTimes(2);
  });
});
