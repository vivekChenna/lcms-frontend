import { useEffect, useSyncExternalStore } from "react";
import { hideSplash, isSplashShown, splashVisibleFor, subscribeSplash } from "@/lib/splash";

/** Nothing new has started loading for this long: the screen behind the splash has settled. */
export const SETTLE_MS = 300;
/** However fast the app is, the splash stays up at least this long, so it reads as intended. */
export const MIN_VISIBLE_MS = 800;
/** Whatever happens, the splash never stays on top of the app longer than this. */
export const MAX_VISIBLE_MS = 12_000;

/**
 * Keeps the splash on screen until the app behind it is ready, then fades it out. "Ready" means
 * `busy` (the session check, the page and its data are loading) has stayed false for SETTLE_MS: a
 * page often starts its data requests a moment after it renders, and a short settle window keeps
 * the splash from lifting in that gap and then showing placeholders.
 */
export function useSplashGate(busy: boolean): void {
  const shown = useSyncExternalStore(subscribeSplash, isSplashShown, () => false);

  useEffect(() => {
    if (!shown) return;
    const cap = window.setTimeout(hideSplash, Math.max(0, MAX_VISIBLE_MS - splashVisibleFor()));
    return () => window.clearTimeout(cap);
  }, [shown]);

  useEffect(() => {
    if (!shown || busy) return;
    const wait = Math.max(SETTLE_MS, MIN_VISIBLE_MS - splashVisibleFor());
    const timer = window.setTimeout(hideSplash, wait);
    return () => window.clearTimeout(timer);
  }, [shown, busy]);
}
