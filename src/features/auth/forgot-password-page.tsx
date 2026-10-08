import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@/lib/auth";
import { AuthShell } from "./auth-shell";
import { authErrorMessage } from "./messages";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
});
type Values = z.infer<typeof schema>;

const BackToSignIn = () => (
  <Link
    to="/login"
    className="block py-3 text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
  >
    Back to sign in
  </Link>
);

/** Public: ask for a link to choose a new password. The answer never reveals whether an account exists. */
export function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });
  const { errors } = form.formState;

  if (forgot.isSuccess) {
    return (
      <AuthShell title="Check your email">
        <p role="status" className="text-sm">
          If that account exists, we&rsquo;ve emailed it a link to choose a new password. The link
          works once and expires in 48 hours.
        </p>
        <BackToSignIn />
      </AuthShell>
    );
  }

  const onSubmit = form.handleSubmit(({ email }) => forgot.mutate({ email }));

  return (
    <AuthShell
      title="Forgot your password?"
      description="We'll email you a link to choose a new one."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {forgot.isError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {authErrorMessage(forgot.error)}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="fp-email">Email</Label>
          <Input
            id="fp-email"
            type="email"
            autoComplete="email"
            className="h-11 text-base md:text-base"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "fp-email-error" : undefined}
            {...form.register("email")}
          />
          {errors.email && (
            <p id="fp-email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
        <Button type="submit" className="h-11 w-full" disabled={forgot.isPending}>
          {forgot.isPending && <Loader2 className="animate-spin" aria-hidden />}
          Send link
        </Button>
        <BackToSignIn />
      </form>
    </AuthShell>
  );
}
