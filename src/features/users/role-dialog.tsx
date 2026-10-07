import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { UserDto, UserRole } from "@/lib/api/types";
import { ROLE_LABEL } from "@/lib/labels";
import { useChangeRole } from "./use-users";

const ROLES: UserRole[] = ["admin", "legal_manager", "legal_rep", "requester", "viewer"];

type Props = { user: UserDto; open: boolean; onOpenChange: (open: boolean) => void };

export function RoleDialog({ user, open, onOpenChange }: Props) {
  const changeRole = useChangeRole(user.id);
  const [role, setRole] = useState<UserRole>(user.role);

  const confirm = () => {
    if (role === user.role) return;
    changeRole.mutate(role, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={changeRole.isPending}
      title={`Change role for ${user.fullName}`}
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          disabled={role === user.role || changeRole.isPending}
          onClick={confirm}
        >
          Save
        </Button>
      }
    >
      <Label htmlFor="role-select">Role</Label>
      <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
        <SelectTrigger id="role-select" className="mt-1 h-11 lg:h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_LABEL[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {changeRole.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {changeRole.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}
