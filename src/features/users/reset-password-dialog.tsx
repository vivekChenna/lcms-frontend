import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { UserDto } from "@/lib/api/types";
import { useResetPassword } from "./use-users";

type Props = { user: UserDto; open: boolean; onOpenChange: (open: boolean) => void };

export function ResetPasswordDialog({ user, open, onOpenChange }: Props) {
  const resetPassword = useResetPassword(user.id);
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const tooShort = password.length < 8;

  const confirm = () => {
    setTouched(true);
    if (tooShort) return;
    resetPassword.mutate(password, {
      onSuccess: () => {
        setPassword("");
        setTouched(false);
        onOpenChange(false);
      },
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={resetPassword.isPending}
      title={`Reset password for ${user.fullName}`}
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          disabled={resetPassword.isPending}
          onClick={confirm}
        >
          Reset password
        </Button>
      }
    >
      <Label htmlFor="rp-password">New password</Label>
      <Input
        id="rp-password"
        type="password"
        className="mt-1 h-11 lg:h-9"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {touched && tooShort && (
        <p role="alert" className="mt-1 text-sm text-danger">
          Password must be at least 8 characters.
        </p>
      )}
      {resetPassword.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {resetPassword.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}
