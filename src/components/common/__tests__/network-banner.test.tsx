import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NetworkBanner } from "../network-banner";

afterEach(cleanup);

beforeEach(() => {
  Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
});

describe("NetworkBanner", () => {
  it("renders nothing while online", () => {
    render(<NetworkBanner />);
    expect(screen.queryByText(/you appear to be offline/i)).not.toBeInTheDocument();
  });

  it("shows the banner when the browser goes offline, and hides it again when back online", () => {
    render(<NetworkBanner />);
    act(() => {
      Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText(/you appear to be offline/i)).toBeInTheDocument();

    act(() => {
      Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByText(/you appear to be offline/i)).not.toBeInTheDocument();
  });
});
