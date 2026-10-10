const FADE_MS = 450;

// The splash is one element, #splash in index.html, so it is on screen from the first byte. It is
// never removed: hiding fades it out and parks it, and showing it again (after sign-in) fades the
// same element back in. That keeps the whole look in one place.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
// performance.now() timestamp of when the splash last became visible; 0 = the page load itself
let shownAt = 0;
let hideTimer: number | undefined;

const element = () => document.getElementById("splash");

export function isSplashShown(): boolean {
  const el = element();
  return !!el && el.style.display !== "none" && !el.classList.contains("splash-hide");
}

export function subscribeSplash(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** How long the splash has been on screen, in ms. */
export function splashVisibleFor(): number {
  return performance.now() - shownAt;
}

/** Fade the splash in over whatever is on screen (used when sign-in succeeds). */
export function showSplash(): void {
  const el = element();
  if (!el) return;
  window.clearTimeout(hideTimer);
  el.style.display = "";
  void el.offsetWidth; // let the browser register the visible state so the fade-in can run
  el.classList.remove("splash-hide");
  shownAt = performance.now();
  notify();
}

/** Fade the splash out, revealing the app that has been loading underneath it. */
export function hideSplash(): void {
  const el = element();
  if (!el || !isSplashShown()) return;
  el.classList.add("splash-hide");
  notify();
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    el.style.display = "none";
    return;
  }
  hideTimer = window.setTimeout(() => {
    if (el.classList.contains("splash-hide")) el.style.display = "none";
  }, FADE_MS + 50);
}
