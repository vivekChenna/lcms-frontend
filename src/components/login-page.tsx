import { PasswordInput } from "@/components/ui/password-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/features/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { useLogin, type LoginNotice } from "@/lib/auth";
import { safeRedirect } from "@/lib/guards";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
type LoginValues = z.infer<typeof loginSchema>;

function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.status === 429 ? "Too many attempts, try again shortly" : err.message;
  }
  return "Could not reach the server. Check your connection and try again.";
}

const NOTICES: Record<LoginNotice, string> = {
  "password-changed": "Password changed. Sign in with your new password.",
  "password-set": "Password set. Sign in with your new password.",
};

export function LoginPage({
  redirect,
  notice,
}: {
  redirect?: string | undefined;
  notice?: LoginNotice | undefined;
}) {
  const navigate = useNavigate();
  const login = useLogin();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, { onSuccess: () => void navigate({ href: safeRedirect(redirect) }) }),
  );

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your Algihaz credentials to continue."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {notice && !login.isError && (
          <p
            role="status"
            className="rounded-md border border-info-border bg-info p-3 text-sm text-info-foreground"
          >
            {NOTICES[notice]}
          </p>
        )}
        {login.isError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {loginErrorMessage(login.error)}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@company.com"
            className="h-12 text-base md:text-base lg:h-12 lg:text-base"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...form.register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            className="h-12 text-base md:text-base lg:h-12 lg:text-base"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...form.register("password")}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
          <Link
            to="/forgot-password"
            className="-my-2 block py-3 text-right text-sm text-primary underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="h-12 w-full text-base" disabled={login.isPending}>
          {login.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Sign in
          {!login.isPending && <ArrowRight aria-hidden />}
        </Button>
      </form>
    </AuthShell>
  );
}
