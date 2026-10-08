import { PasswordInput } from "@/components/ui/password-input";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, fieldErrors } from "@/lib/api/errors";
import { useChangePassword, useLogout } from "@/lib/auth";

type Values = { currentPassword: string; newPassword: string; confirm: string };
const FORM_ID = "change-password-form";

const fields = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  { name: "newPassword", label: "New password", autoComplete: "new-password" },
  { name: "confirm", label: "Confirm new password", autoComplete: "new-password" },
] as const;

type FieldErrors = Partial<Record<"currentPassword" | "newPassword", string>>;

/** Backend errors that belong on a field: validation `details`, or a bare "current password" message. */
function toFieldErrors(err: unknown): FieldErrors {
  const out: FieldErrors = {};
  for (const [field, message] of Object.entries(fieldErrors(err))) {
    if (field === "currentPassword" || field === "newPassword") out[field] = message;
  }
  if (
    Object.keys(out).length === 0 &&
    err instanceof ApiError &&
    (err.status === 400 || err.status === 401) &&
    /current password/i.test(err.message)
  ) {
    out.currentPassword = err.message;
  }
  return out;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const change = useChangePassword();
  const logout = useLogout();
  const busy = change.isPending || logout.isPending;
  const form = useForm<Values>({
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });
  const { errors } = form.formState;

  const close = (next: boolean) => {
    if (!next) {
      form.reset();
      change.reset();
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit(({ currentPassword, newPassword }) =>
    change.mutate(
      { currentPassword, newPassword },
      {
        // The backend revokes every refresh token, so sign this session out now as well.
        onSuccess: () => logout.mutate({ notice: "password-changed" }),
        onError: (err) => {
          for (const [field, message] of Object.entries(toFieldErrors(err)))
            form.setError(field as keyof FieldErrors, { message });
        },
      },
    ),
  );

  const rules = {
    currentPassword: { required: "Enter your current password." },
    newPassword: {
      required: "Enter a new password.",
      minLength: { value: 8, message: "Use at least 8 characters." },
    },
    confirm: {
      validate: (v: string) => v === form.getValues("newPassword") || "Passwords do not match.",
    },
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={close}
      title="Change password"
      description="You'll be signed out on all devices, including this one."
      pending={busy}
      footer={
        <>
          <Button variant="outline" onClick={() => close(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden />}
            Change password
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="space-y-4">
        {change.isError && Object.keys(toFieldErrors(change.error)).length === 0 && (
          <p
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {change.error instanceof ApiError
              ? change.error.message
              : "Could not reach the server. Check your connection and try again."}
          </p>
        )}
        {fields.map(({ name, label, autoComplete }) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={`cp-${name}`}>{label}</Label>
            <PasswordInput
              id={`cp-${name}`}
              autoComplete={autoComplete}
              className="h-11 lg:h-9"
              aria-invalid={!!errors[name]}
              {...(errors[name] ? { "aria-describedby": `cp-${name}-error` } : {})}
              {...form.register(name, rules[name])}
            />
            {errors[name] && (
              <p id={`cp-${name}-error`} className="text-sm text-destructive">
                {errors[name]?.message}
              </p>
            )}
          </div>
        ))}
      </form>
    </ResponsiveDialog>
  );
}
