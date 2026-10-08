import { ConfirmDialog } from "@/components/common/confirm-dialog";
import type { UserDto } from "@/lib/api/types";
import { useSendPasswordLink } from "./use-users";

type Props = { user: UserDto; open: boolean; onOpenChange: (open: boolean) => void };

/** Admin action: email the user a link to choose a (new) password. Admins never see or set one. */
export function SendLinkDialog({ user, open, onOpenChange }: Props) {
  const send = useSendPasswordLink(user);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={send.isPending}
      title={user.isInvited ? "Resend the invitation?" : "Send a password reset link?"}
      description={`${user.fullName} (${user.email}) will get an email with a link to choose ${
        user.isInvited ? "their" : "a new"
      } password. Any earlier link stops working.`}
      confirmLabel="Send link"
      onConfirm={() => send.mutate(undefined, { onSuccess: () => onOpenChange(false) })}
    />
  );
}
