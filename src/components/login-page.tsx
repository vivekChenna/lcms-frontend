import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Gavel, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/errors";
import { useLogin, type LoginNotice } from "@/lib/auth";
import { safeRedirect } from "@/lib/guards";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
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
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
            <Gavel className="size-6" aria-hidden />
          </div>
          <CardTitle className="text-2xl">Sign in to LCMS</CardTitle>
          <CardDescription>Use your Algihaz credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent>
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
                className="h-11 text-base md:text-base"
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-11 pr-12 text-base md:text-base"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...form.register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 size-11"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                </Button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="h-11 w-full" disabled={login.isPending}>
              {login.isPending && <Loader2 className="animate-spin" aria-hidden />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
