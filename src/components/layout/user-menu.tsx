import { KeyRound, LogOut } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/lib/api/types";
import { useLogout } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { ChangePasswordDialog } from "./change-password-dialog";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export function UserMenu({ me }: { me: Profile }) {
  const logout = useLogout();
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Account menu for ${me.fullName}`}
            className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-md hover:bg-muted lg:h-9 lg:px-2"
          >
            <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials(me.fullName)}
            </span>
            <span className="hidden max-w-40 truncate text-sm font-medium xl:block">
              {me.fullName}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-1rem)]">
          <DropdownMenuLabel className="space-y-0.5 font-normal">
            <p className="truncate font-medium">{me.fullName}</p>
            {me.designation && (
              <p className="truncate text-xs text-muted-foreground">{me.designation}</p>
            )}
            <p className="text-xs text-muted-foreground">{ROLE_LABEL[me.role]}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-11 lg:min-h-8" onSelect={() => setPasswordOpen(true)}>
            <KeyRound />
            Change password
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11 lg:min-h-8"
            disabled={logout.isPending}
            onSelect={() => logout.mutate()}
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
