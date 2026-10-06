// Test helper: a matchMedia stub that answers min-width/max-width queries for the current width.
// Changing the width with `setViewport` fires "change" on every live MediaQueryList listener.
let width = 1024;
type Listener = (e: MediaQueryListEvent) => void;
const listeners = new Set<Listener>();

const evaluate = (query: string) => {
  const min = /min-width:\s*([\d.]+)px/.exec(query)?.[1];
  const max = /max-width:\s*([\d.]+)px/.exec(query)?.[1];
  return (!min || width >= Number(min)) && (!max || width <= Number(max));
};

function matchMedia(query: string): MediaQueryList {
  return {
    get matches() {
      return evaluate(query);
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, fn: Listener) => listeners.add(fn),
    removeEventListener: (_type: string, fn: Listener) => listeners.delete(fn),
    addListener: (fn: Listener) => listeners.add(fn),
    removeListener: (fn: Listener) => listeners.delete(fn),
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
}

export function setViewport(next: number) {
  width = next;
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: next });
  window.matchMedia = matchMedia;
  for (const fn of [...listeners]) fn({ matches: true, media: "" } as MediaQueryListEvent);
}
