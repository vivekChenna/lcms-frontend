const FADE_MS = 350;

/** Fade the splash screen from index.html out and remove it. Safe to call when it is already gone. */
export function hideSplash(): void {
  const splash = document.getElementById("splash");
  if (!splash) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    splash.remove();
    return;
  }
  splash.classList.add("splash-hide");
  window.setTimeout(() => splash.remove(), FADE_MS + 50);
}

/**
 * Hide the splash once the app is ready, but not before it has been up for `minMs`: on a fast
 * connection an instant flash of the logo looks like a glitch, while a short beat looks intended.
 */
export function hideSplashAfterMinimum(minMs = 600): void {
  window.setTimeout(hideSplash, Math.max(0, minMs - performance.now()));
}
