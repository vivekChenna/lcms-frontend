import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { meQueryOptions } from "@/lib/auth";
import { NotFoundContent } from "./not-found";

/**
 * The page for an address that matches nothing. Someone who is signed in keeps their sidebar and
 * top bar around it, so it reads as "that page is missing", not "you were thrown out of the app";
 * a visitor who is not signed in gets it on its own.
 */
export function NotFoundScreen() {
  const me = useQuery(meQueryOptions());
  if (me.data) {
    return (
      <AppShell>
        <NotFoundContent />
      </AppShell>
    );
  }
  // while the session is still being checked, show nothing rather than flash the bare page first
  if (me.isPending) return null;
  return (
    <main className="grid min-h-dvh place-items-center bg-background p-4">
      <NotFoundContent />
    </main>
  );
}
