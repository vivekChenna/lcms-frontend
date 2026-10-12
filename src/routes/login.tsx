import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { LoginPage } from "@/components/login-page";
import { authConfigQueryOptions } from "@/lib/auth";
import { loadSession, safeRedirect } from "@/lib/guards";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(undefined),
    notice: z.enum(["password-changed", "password-set"]).optional().catch(undefined),
  }),
  beforeLoad: async ({ context, search }) => {
    let me = null;
    try {
      me = await loadSession(context.queryClient);
    } catch {
      // the server is down or failing: show the form anyway; signing in reports the problem
    }
    if (me) throw redirect({ href: safeRedirect(search.redirect) });
  },
  head: () => ({
    meta: [
      { title: "Sign In | Algihaz LCMS" },
      { name: "description", content: "Sign in to Algihaz Legal Case Management." },
      { property: "og:title", content: "Sign In | Algihaz LCMS" },
      { property: "og:description", content: "Sign in to Algihaz Legal Case Management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect: to, notice } = Route.useSearch();
  // until the server answers (or if it cannot), the password form is shown
  const { data: config } = useQuery(authConfigQueryOptions());
  return <LoginPage redirect={to} notice={notice} mode={config?.mode ?? "local"} />;
}
