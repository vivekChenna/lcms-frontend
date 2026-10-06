import { QueryClient } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/login";

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

type BeforeLoad = (ctx: {
  context: { queryClient: QueryClient };
  search: { redirect?: string };
}) => Promise<unknown>;

const beforeLoad = (search: { redirect?: string } = {}) =>
  (Route.options.beforeLoad as unknown as BeforeLoad)({
    context: { queryClient: new QueryClient() },
    search,
  });

describe("/login search", () => {
  const validate = Route.options.validateSearch as unknown as { parse: (v: unknown) => unknown };
  it("accepts only the known notice", () => {
    expect(validate.parse({ notice: "password-changed" })).toEqual({ notice: "password-changed" });
    // an unknown value is dropped, never an error page
    expect(validate.parse({ notice: "<script>" })).toEqual({ notice: undefined });
  });

  it("keeps a valid redirect", () => {
    expect(validate.parse({ redirect: "/cases?status=Closed" })).toEqual({
      redirect: "/cases?status=Closed",
    });
  });

  it.each([123, [1], true, ["x"], { a: 1 }])("ignores a non-string redirect (%j)", (value) => {
    // the router parses ?redirect=123 into a number; this must not render the error page
    expect(validate.parse({ redirect: value })).toEqual({ redirect: undefined });
  });
});

describe("/login beforeLoad", () => {
  it("shows the form when the session check fails with a server error", async () => {
    fetchMock.mockResolvedValue(json(500, { error: { code: "INTERNAL", message: "boom" } }));
    await expect(beforeLoad()).resolves.toBeUndefined();
  });

  it("shows the form when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(beforeLoad()).resolves.toBeUndefined();
  });

  it("sends a signed-in user to the safe redirect", async () => {
    fetchMock.mockResolvedValue(json(200, { id: "u1", fullName: "A", role: "admin" }));
    const err = await beforeLoad({ redirect: "/cases?page=2" }).catch((e: unknown) => e);
    expect(isRedirect(err)).toBe(true);
    expect((err as Response & { options: object }).options).toMatchObject({
      href: "/cases?page=2",
    });
  });
});
