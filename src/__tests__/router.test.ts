import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe("getRouter's QueryClient", () => {
  it("toasts once for a network failure, and not at all for a regular 4xx", async () => {
    const { getRouter } = await import("../router");
    const { toast } = await import("sonner");
    const router = getRouter();
    const queryClient = router.options.context.queryClient;

    await queryClient
      .fetchQuery({
        queryKey: ["net-fail-test"],
        queryFn: () => Promise.reject(new TypeError("Failed to fetch")),
        retry: false,
      })
      .catch(() => undefined);
    expect(toast.error).toHaveBeenCalledWith("Can't reach the server", { id: "network-error" });

    vi.mocked(toast.error).mockClear();

    const { ApiError } = await import("@/lib/api/errors");
    await queryClient
      .fetchQuery({
        queryKey: ["api-error-test"],
        queryFn: () => Promise.reject(new ApiError(404, "NOT_FOUND", "Not found")),
        retry: false,
      })
      .catch(() => undefined);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
