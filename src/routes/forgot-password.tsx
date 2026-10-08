import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/features/auth/forgot-password-page";

// Public: nothing here needs a session.
export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password | Algihaz LCMS" }] }),
  component: ForgotPasswordPage,
});
