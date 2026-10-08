import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { SetPasswordPage } from "@/features/auth/set-password-page";

// Public: the one-time token in the emailed link is the credential, so there is no session guard.
export const Route = createFileRoute("/set-password")({
  validateSearch: z.object({ token: z.string().optional().catch(undefined) }),
  head: () => ({ meta: [{ title: "Choose your password | Algihaz LCMS" }] }),
  component: SetPasswordRoute,
});

function SetPasswordRoute() {
  const { token } = Route.useSearch();
  const navigate = Route.useNavigate();
  // keep the token in memory but take it out of the address bar, history and any shared screenshot
  const [kept] = useState(token);
  useEffect(() => {
    if (token) void navigate({ search: {}, replace: true });
  }, [token, navigate]);
  return <SetPasswordPage token={kept} />;
}
