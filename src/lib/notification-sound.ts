const KEY = "lcms-notification-sound";

/**
 * The feature itself is opt-in per deployment: it exists only when the build is given
 * VITE_NOTIFICATION_SOUND=true (read when Vite starts or builds). Anything else, including no
 * setting at all, leaves it off: no chime, and no switch on the Profile page.
 */
export function isSoundFeatureOn(): boolean {
  return import.meta.env["VITE_NOTIFICATION_SOUND"] === "true";
}

/** Whether a chime should play now: the feature is on, and this device has not turned it off. */
export function isSoundEnabled(): boolean {
  if (!isSoundFeatureOn()) return false;
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    // storage blocked: the choice just lasts until the page is reloaded (nothing to do)
  }
}

let context: AudioContext | undefined;

/**
 * A soft two-note chime made with the browser's own audio engine, so there is no sound file to
 * ship. Browsers only let a page play sound after the person has interacted with it (a click or a
 * key press); before that this quietly does nothing rather than raising an error.
 */
export function playNotificationSound(): void {
  try {
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    context ??= new Ctx();
    const ctx = context;
    if (ctx.state === "suspended") void ctx.resume();

    const note = (frequency: number, offset: number) => {
      const start = ctx.currentTime + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      // quick fade in and a longer fade out, so it reads as a chime and not a click
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    };
    note(880, 0);
    note(1320, 0.14);
  } catch {
    // no audio available or not allowed yet: stay silent
  }
}
