import { KeyRound, MoreHorizontal, Pencil, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserDto } from "@/lib/api/types";

type Props = {
  user: UserDto;
  /** The signed-in admin cannot deactivate themselves. */
  isSelf: boolean;
  onEdit: () => void;
  onRole: () => void;
  onReset: () => void;
  onToggleActive: () => void;
};

/** One "⋯" menu per user row instead of four loose text buttons. */
export function UserRowMenu({ user, isSelf, onEdit, onRole, onReset, onToggleActive }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9"
          aria-label={`Actions for ${user.fullName}`}
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil aria-hidden /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onRole}>
          <ShieldCheck aria-hidden /> Change role
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onReset}>
          <KeyRound aria-hidden /> Reset password
        </DropdownMenuItem>
        {!isSelf && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onToggleActive}
              className={user.isActive ? "text-danger focus:text-danger" : undefined}
            >
              {user.isActive ? <UserX aria-hidden /> : <UserCheck aria-hidden />}
              {user.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
