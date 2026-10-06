// Test helper: a matchMedia stub that answers min-width/max-width queries for a given width.
export function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  window.matchMedia = (query: string) => {
    const min = /min-width:\s*([\d.]+)px/.exec(query)?.[1];
    const max = /max-width:\s*([\d.]+)px/.exec(query)?.[1];
    const matches = (!min || width >= Number(min)) && (!max || width <= Number(max));
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
}
