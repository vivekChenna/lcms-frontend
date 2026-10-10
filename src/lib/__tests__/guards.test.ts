import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile, UserRole } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { isRedirect } from "@tanstack/react-router";
import {
  guardDecision,
  loadSession,
  requireNav,
  safeRedirect,
  sessionExpiredHandler,
} from "../guards";

const profile = (role: UserRole) => ({ id: "u1", fullName: "Test User", role }) as Profile;

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("guardDecision", () => {
  it("no session goes to /login", () => {
    expect(guardDecision(null, "cases")).toEqual({ redirectTo: "/login" });
    expect(guardDecision(null)).toEqual({ redirectTo: "/login" });
  });
  it("a role without access goes home", () => {
    expect(guardDecision(profile("viewer"), "audit")).toEqual({ redirectTo: "/dashboard" });
  });
  it("an allowed role passes", () => {
    expect(guardDecision(profile("admin"), "master-data")).toBeNull();
  });
  it("no key only needs a session", () => {
    expect(guardDecision(profile("viewer"))).toBeNull();
  });
});

describe("loadSession", () => {
  it("returns the profile from /auth/me", async () => {
    fetchMock.mockResolvedValue(json(200, profile("admin")));
    await expect(loadSession(new QueryClient())).resolves.toMatchObject({ role: "admin" });
  });
  it("returns null on a 401", async () => {
    fetchMock.mockResolvedValue(json(401, { error: { code: "UNAUTHORIZED", message: "no" } }));
    await expect(loadSession(new QueryClient())).resolves.toBeNull();
  });
  it("rethrows a 500", async () => {
    fetchMock.mockResolvedValue(json(500, { error: { code: "INTERNAL", message: "boom" } }));
    const err = await loadSession(new QueryClient()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
  });
});

describe("safeRedirect", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeRedirect("/cases")).toBe("/cases");
    expect(safeRedirect("/cases?status=Closed#x")).toBe("/cases?status=Closed#x");
  });
  it.each([
    undefined,
    "",
    "//evil.com",
    "https://evil.com",
    "http://evil.com/x",
    "/\\evil.com",
    "\\\\evil.com",
    "evil.com",
    "javascript:alert(1)",
    " /cases",
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r/evil.com",
    "/cases\u0000",
    "/\u007f/evil.com",
  ])("rejects %j", (value) => {
    expect(safeRedirect(value)).toBe("/dashboard");
  });
});

describe("requireNav", () => {
  const withMe = (me: Profile | null) => {
    const qc = new QueryClient();
    if (me) qc.setQueryData(["me"], me);
    else fetchMock.mockResolvedValue(json(401, { error: { code: "UNAUTHORIZED", message: "no" } }));
    return qc;
  };
  const thrown = (p: Promise<unknown>) =>
    p.then(
      () => undefined,
      (e: unknown) => e,
    );

  it("redirects to /login remembering the current href when signed out", async () => {
    const err = await thrown(requireNav(withMe(null), { href: "/audit?page=2" }, "audit"));
    expect(isRedirect(err)).toBe(true);
    expect((err as Response & { options: object }).options).toMatchObject({
      to: "/login",
      search: { redirect: "/audit?page=2" },
    });
  });

  it("redirects to the dashboard when the role may not see the route", async () => {
    const err = await thrown(requireNav(withMe(profile("viewer")), { href: "/audit" }, "audit"));
    expect(isRedirect(err)).toBe(true);
    expect((err as Response & { options: object }).options).toMatchObject({ to: "/dashboard" });
  });

  it("returns the profile for an allowed role", async () => {
    const me = profile("admin");
    await expect(requireNav(withMe(me), { href: "/audit" }, "audit")).resolves.toEqual(me);
  });
});

describe("sessionExpiredHandler", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = (initial: string) => {
    const loc = { pathname: initial.split("?")[0]!, href: initial };
    const qc = new QueryClient();
    qc.setQueryData(["me"], profile("admin"));
    const goToLogin = vi.fn();
    const handler = sessionExpiredHandler(qc, () => loc, goToLogin);
    const moveTo = (href: string) => Object.assign(loc, { pathname: href.split("?")[0], href });
    return { qc, goToLogin, handler, moveTo };
  };

  it("clears the cache and goes to /login with the current location", () => {
    const { qc, goToLogin, handler } = setup("/cases?page=2");
    handler();
    expect(qc.getQueryData(["me"])).toBeUndefined();
    vi.runAllTimers();
    expect(goToLogin).toHaveBeenCalledExactlyOnceWith("/cases?page=2");
  });

  it("does not navigate again when a guard already redirected to /login (cold load)", () => {
    const { goToLogin, handler, moveTo } = setup("/cases");
    handler();
    moveTo("/login?redirect=%2Fcases");
    vi.runAllTimers();
    expect(goToLogin).not.toHaveBeenCalled();
  });

  it("navigates once when a straggler fires before the navigation settles", async () => {
    const { goToLogin, handler } = setup("/cases");
    let settle!: () => void;
    goToLogin.mockImplementation(() => new Promise<void>((r) => (settle = r)));
    handler();
    vi.runAllTimers();
    handler();
    vi.runAllTimers();
    expect(goToLogin).toHaveBeenCalledTimes(1);
    settle();
    await vi.runAllTimersAsync();
    handler();
    vi.runAllTimers();
    expect(goToLogin).toHaveBeenCalledTimes(2);
  });

  it("does nothing when already on /login (never nests the redirect)", () => {
    const { qc, goToLogin, handler } = setup("/login?redirect=%2Fcases");
    handler();
    handler();
    expect(qc.getQueryData(["me"])).toBeDefined();
    vi.runAllTimers();
    expect(goToLogin).not.toHaveBeenCalled();
  });
});
