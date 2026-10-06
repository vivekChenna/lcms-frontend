import "@testing-library/jest-dom/vitest";

// jsdom lacks these; vaul (Drawer) and Radix call them during pointer and focus handling.
if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
// jsdom's window.scrollTo only logs "Not implemented"; make it a silent no-op.
window.scrollTo = (() => {}) as typeof window.scrollTo;
