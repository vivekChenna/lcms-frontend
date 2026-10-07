import "@testing-library/jest-dom/vitest";

// jsdom lacks these; vaul (Drawer) and Radix call them during pointer and focus handling.
if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
// jsdom's window.scrollTo only logs "Not implemented"; make it a silent no-op.
window.scrollTo = (() => {}) as typeof window.scrollTo;

// jsdom has no ResizeObserver; recharts' ResponsiveContainer needs one to measure its container.
if (!("ResizeObserver" in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ResizeObserver = ResizeObserverStub;
}

// jsdom has no URL.createObjectURL/revokeObjectURL; apiDownload (file/export downloads) needs
// them to turn a Blob into a clickable link. A fixed stub string is enough for tests that only
// assert the download happened, not the blob's bytes.
if (!URL.createObjectURL) URL.createObjectURL = () => "blob:stub";
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};
