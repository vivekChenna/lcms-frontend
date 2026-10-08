import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyTheme, readStoredTheme, resolveTheme, setTheme } from "../theme";

function stubSystemDark(dark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("dark") ? dark : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  stubSystemDark(false);
});
afterEach(() => localStorage.clear());

describe("theme", () => {
  it("defaults to system when nothing is stored or the stored value is junk", () => {
    expect(readStoredTheme()).toBe("system");
    localStorage.setItem("lcms-theme", "purple");
    expect(readStoredTheme()).toBe("system");
  });

  it("resolves system from the OS preference", () => {
    stubSystemDark(true);
    expect(resolveTheme("system")).toBe("dark");
    stubSystemDark(false);
    expect(resolveTheme("system")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("setTheme persists the choice and toggles the dark class and color-scheme", () => {
    setTheme("dark");
    expect(localStorage.getItem("lcms-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");

    setTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("applyTheme('system') follows the OS", () => {
    stubSystemDark(true);
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("still works when storage is unavailable", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
    try {
      expect(() => setTheme("dark")).not.toThrow();
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});
