import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { meQueryOptions } from "./auth";
import { ApiError } from "./api/errors";
import type { NavKey } from "./permissions";
import { canSee } from "./permissions";
import type { Profile } from "./api/types";

export async function loadSession(queryClient: QueryClient): Promise<Profile | null> {
  try {
    return await queryClient.ensureQueryData(meQueryOptions());
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

/** pure decision used by routes and unit-tested */
export function guardDecision(
  me: Profile | null,
  key?: NavKey,
): { redirectTo: "/login" | "/" } | null {
  if (!me) return { redirectTo: "/login" };
  if (key && !canSee(me.role, key)) return { redirectTo: "/" };
  return null;
}

export async function requireNav(
  queryClient: QueryClient,
  location: { href: string },
  key?: NavKey,
) {
  const me = await loadSession(queryClient);
  const d = guardDecision(me, key);
  if (d?.redirectTo === "/login")
    throw redirect({ to: "/login", search: { redirect: location.href } });
  if (d) throw redirect({ to: d.redirectTo });
  return me!;
}

/**
 * Only same-origin relative paths ("/x", not "//x", "/\x", absolute URLs or anything with a
 * control character, which URL parsing strips so "/\t/x" would become "//x"); anything else is "/".
 */
export function safeRedirect(target: string | undefined): string {
  if (
    !target ||
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.includes("\\") ||
    // eslint-disable-next-line no-control-regex
    /[\x00-\x1f\x7f]/.test(target)
  ) {
    return "/";
  }
  return target;
}

/**
 * Handler for `setSessionExpiredHandler`: idempotent. No-op on /login (so the redirect never
 * nests) and while a previous redirect is still settling; otherwise clears the cache and goes
 * to /login once, remembering where the user was. The navigation waits one task so that a
 * route guard handling the same 401 (cold load without a session) redirects first, and then
 * it is skipped.
 */
export function sessionExpiredHandler(
  queryClient: QueryClient,
  getLocation: () => { pathname: string; href: string },
  goToLogin: (redirectTo: string) => unknown,
) {
  let pending = false;
  return () => {
    if (pending || getLocation().pathname === "/login") return;
    pending = true;
    queryClient.clear();
    setTimeout(() => {
      const { pathname, href } = getLocation();
      const nav = pathname === "/login" ? undefined : goToLogin(href);
      void Promise.resolve(nav).finally(() => {
        pending = false;
      });
    }, 0);
  };
}
