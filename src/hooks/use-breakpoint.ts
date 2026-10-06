import { useSyncExternalStore } from "react";

export type Breakpoint = "base" | "sm" | "md" | "lg" | "xl";

// Tailwind's default breakpoints, widest first.
const BUCKETS: [Exclude<Breakpoint, "base">, number][] = [
  ["xl", 1280],
  ["lg", 1024],
  ["md", 768],
  ["sm", 640],
];
const query = (px: number) => `(min-width: ${px}px)`;

function snapshot(): Breakpoint {
  if (typeof window === "undefined" || !window.matchMedia) return "lg";
  return BUCKETS.find(([, px]) => window.matchMedia(query(px)).matches)?.[0] ?? "base";
}

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const lists = BUCKETS.map(([, px]) => window.matchMedia(query(px)));
  lists.forEach((l) => l.addEventListener("change", onChange));
  return () => lists.forEach((l) => l.removeEventListener("change", onChange));
}

/** Current Tailwind breakpoint bucket; `'lg'` where there is no window (SSR). */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, snapshot, () => "lg");
}

/** md and up: tables, centered dialogs. Below: cards, bottom drawers. */
export const isMdUp = (bp: Breakpoint) => bp === "md" || bp === "lg" || bp === "xl";
