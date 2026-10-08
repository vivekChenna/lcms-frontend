import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError } from "@/lib/api/errors";
import { useSetPassword } from "@/lib/auth";
import { AuthShell } from "./auth-shell";
import { authErrorMessage } from "./messages";

const schema = z
  .object({
    newPassword: z.string().min(1, "Enter a new password.").min(8, "Use at least 8 characters."),
    confirm: z.string().min(1, "Confirm your new password."),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ["confirm"],
    message: "The two passwords do not match.",
  });
type Values = z.infer<typeof schema>;

const LINK_DEAD = /no longer valid/i;

function DeadLink() {
  return (
    <AuthShell
      title="This link is no longer valid"
      description="It may have expired, already been used, or been replaced by a newer one."
    >
      <div className="space-y-3">
        <Button asChild className="h-11 w-full">
          <Link to="/forgot-password">Send me a new link</Link>
        </Button>
        <Link
          to="/login"
          className="block py-3 text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}

/** Opened from the emailed link: the person chooses their own password. `token` comes from the URL. */
export function SetPasswordPage({ token }: { token: string | undefined }) {
  const navigate = useNavigate();
  const setPassword = useSetPassword();
  const [dead, setDead] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirm: "" },
  });
  const { errors } = form.formState;

  if (!token || dead) return <DeadLink />;

  const onSubmit = form.handleSubmit(({ newPassword }) =>
    setPassword.mutate(
      { token, newPassword },
      {
        onSuccess: () => void navigate({ to: "/login", search: { notice: "password-set" } }),
        onError: (err) => {
          if (err instanceof ApiError && LINK_DEAD.test(err.message)) setDead(true);
        },
      },
    ),
  );

  return (
    <AuthShell
      title="Choose your password"
      description="Your password must be at least 8 characters long. Only you will know it."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {setPassword.isError && !dead && (
          <p
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {authErrorMessage(setPassword.error)}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="sp-new">New password</Label>
          <PasswordInput
            id="sp-new"
            autoComplete="new-password"
            className="h-11 text-base md:text-base"
            aria-invalid={!!errors.newPassword}
            aria-describedby={errors.newPassword ? "sp-new-error" : undefined}
            {...form.register("newPassword")}
          />
          {errors.newPassword && (
            <p id="sp-new-error" className="text-sm text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sp-confirm">Confirm password</Label>
          <PasswordInput
            id="sp-confirm"
            autoComplete="new-password"
            className="h-11 text-base md:text-base"
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? "sp-confirm-error" : undefined}
            {...form.register("confirm")}
          />
          {errors.confirm && (
            <p id="sp-confirm-error" className="text-sm text-destructive">
              {errors.confirm.message}
            </p>
          )}
        </div>
        <Button type="submit" className="h-11 w-full" disabled={setPassword.isPending}>
          {setPassword.isPending && <Loader2 className="animate-spin" aria-hidden />}
          Set password
        </Button>
        <Link
          to="/login"
          className="block py-3 text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
