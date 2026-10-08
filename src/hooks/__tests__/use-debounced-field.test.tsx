import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedField } from "../use-debounced-field";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useDebouncedField", () => {
  it("commits once, after the pause, with the final text", () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useDebouncedField("", commit, 300));
    act(() => result.current.setText("c"));
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.setText("ca"));
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.setText("cas"));
    expect(commit).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith("cas");
  });

  it("reports waiting from the first keystroke until the value is committed", () => {
    const { result, rerender } = renderHook(
      ({ committed }) => useDebouncedField(committed, () => {}, 300),
      { initialProps: { committed: "" } },
    );
    expect(result.current.waiting).toBe(false);
    act(() => result.current.setText("abc"));
    expect(result.current.waiting).toBe(true);
    rerender({ committed: "abc" });
    expect(result.current.waiting).toBe(false);
  });

  it("follows the committed value when it changes from elsewhere (back button, Clear filters)", () => {
    const { result, rerender } = renderHook(
      ({ committed }) => useDebouncedField(committed, () => {}, 300),
      { initialProps: { committed: "old" } },
    );
    expect(result.current.text).toBe("old");
    rerender({ committed: "" });
    expect(result.current.text).toBe("");
  });

  it("does not commit when the text is already the committed value", () => {
    const commit = vi.fn();
    const { result } = renderHook(() => useDebouncedField("same", commit, 300));
    act(() => result.current.setText("same"));
    act(() => vi.advanceTimersByTime(1000));
    expect(commit).not.toHaveBeenCalled();
  });
});
