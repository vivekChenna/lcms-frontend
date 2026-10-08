import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const KEY = "lcms-theme";
const listeners = new Set<() => void>();

export function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

let current: Theme = readStoredTheme();

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

export function setTheme(theme: Theme): void {
  current = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // private window or blocked storage: the choice still applies for this page view
  }
  applyTheme(theme);
  listeners.forEach((l) => l());
}

/** Apply the saved theme and follow the OS while the choice is "system". Call once at startup. */
export function initTheme(): void {
  current = readStoredTheme();
  applyTheme(current);
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if (current === "system") applyTheme("system");
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  const theme = useSyncExternalStore(
    subscribe,
    () => current,
    () => "system" as Theme,
  );
  return { theme, setTheme };
}
