import { QueryClient } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile, UserRole } from "@/lib/api/types";
import type { NavKey } from "@/lib/permissions";
import * as guards from "@/lib/guards";
import { Route as authed } from "@/routes/_authed";
import { Route as home } from "@/routes/_authed.index";
import { Route as cases } from "@/routes/_authed.cases.index";
import { Route as caseDetail } from "@/routes/_authed.cases.$caseId";
import { Route as notifications } from "@/routes/_authed.notifications";
import { Route as newRequest } from "@/routes/_authed.new-request";
import { Route as reports } from "@/routes/_authed.reports";
import { Route as audit } from "@/routes/_authed.audit";
import { Route as users } from "@/routes/_authed.users";
import { Route as masterData } from "@/routes/_authed.master-data";
import { Route as rules } from "@/routes/_authed.rules";

vi.mock("@/lib/guards", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/guards")>();
  return { ...actual, requireNav: vi.fn(actual.requireNav) };
});

const profile = (role: UserRole) => ({ id: "u1", fullName: "Test User", role }) as Profile;

// The plan table: route -> nav key passed to requireNav (undefined = session only).
const table: [string, { options: { beforeLoad?: unknown } }, NavKey | undefined][] = [
  ["/", home, undefined],
  ["/cases/", cases, undefined],
  ["/cases/$caseId", caseDetail, undefined],
  ["/notifications", notifications, undefined],
  ["/new-request", newRequest, "new-request"],
  ["/reports", reports, "reports"],
  ["/audit", audit, "audit"],
  ["/users", users, "users"],
  ["/master-data", masterData, "master-data"],
  ["/rules", rules, "rules"],
];

type BeforeLoad = (ctx: {
  context: { queryClient: QueryClient };
  location: { href: string };
}) => Promise<unknown> | unknown;

function run(route: { options: { beforeLoad?: unknown } }, role: UserRole, href = "/x") {
  const queryClient = new QueryClient();
  queryClient.setQueryData(["me"], profile(role));
  const beforeLoad = route.options.beforeLoad as BeforeLoad | undefined;
  return Promise.resolve(beforeLoad?.({ context: { queryClient }, location: { href } }));
}

beforeEach(() => {
  vi.mocked(guards.requireNav).mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe("route guards", () => {
  it.each(table.filter(([, , key]) => key))(
    "%s calls requireNav with its nav key",
    async (_, route, key) => {
      await run(route, "admin");
      expect(guards.requireNav).toHaveBeenCalledExactlyOnceWith(
        expect.any(QueryClient),
        { href: "/x" },
        key,
      );
    },
  );

  it.each(table.filter(([, , key]) => !key))("%s has no role gate of its own", async (_, route) => {
    await expect(run(route, "viewer")).resolves.toBeUndefined();
    const calls = vi.mocked(guards.requireNav).mock.calls;
    expect(calls.every((c) => c[2] === undefined)).toBe(true);
  });

  it.each(table)(
    "%s: a cached viewer is let in or sent home per the matrix",
    async (_, route, key) => {
      // a viewer may open reports and the read-only Rules & SLAs page (BRD UI-18), nothing else gated
      const forbidden = key !== undefined && key !== "reports" && key !== "rules";
      const outcome = await run(route, "viewer").then(
        (v) => ({ ok: true as const, v }),
        (e: unknown) => ({ ok: false as const, e }),
      );
      if (forbidden) {
        expect(outcome.ok).toBe(false);
        const e = (outcome as { e: unknown }).e;
        expect(isRedirect(e)).toBe(true);
        expect((e as Response & { options: object }).options).toMatchObject({ to: "/" });
      } else {
        expect(outcome).toEqual({ ok: true, v: undefined });
      }
    },
  );

  it("child routes never return the profile from beforeLoad", async () => {
    for (const [, route] of table) await expect(run(route, "admin")).resolves.toBeUndefined();
  });

  it("only the _authed layout returns { me }", async () => {
    const me = await run(authed, "viewer", "/cases");
    expect(me).toEqual({ me: profile("viewer") });
    expect(guards.requireNav).toHaveBeenCalledExactlyOnceWith(expect.any(QueryClient), {
      href: "/cases",
    });
  });
});
