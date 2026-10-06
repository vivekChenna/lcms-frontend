import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, fieldErrors } from "@/lib/api/errors";
import { useChangePassword } from "@/lib/auth";

type Values = { currentPassword: string; newPassword: string; confirm: string };
const FORM_ID = "change-password-form";

const fields = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  { name: "newPassword", label: "New password", autoComplete: "new-password" },
  { name: "confirm", label: "Confirm new password", autoComplete: "new-password" },
] as const;

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const change = useChangePassword();
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
        onSuccess: () => {
          toast.success("Password changed");
          close(false);
        },
        onError: (err) => {
          for (const [field, message] of Object.entries(fieldErrors(err))) {
            if (field === "currentPassword" || field === "newPassword")
              form.setError(field, { message });
          }
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
      description="Other signed-in devices will need to sign in again."
      footer={
        <>
          <Button variant="outline" onClick={() => close(false)} disabled={change.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={change.isPending}>
            {change.isPending && <Loader2 className="animate-spin" aria-hidden />}
            Change password
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="space-y-4">
        {change.isError && (
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
            <Input
              id={`cp-${name}`}
              type="password"
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
