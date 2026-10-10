import { KeyRound, Volume2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { ChangePasswordDialog } from "@/components/layout/change-password-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMe } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import {
  isSoundEnabled,
  isSoundFeatureOn,
  playNotificationSound,
  setSoundEnabled,
} from "@/lib/notification-sound";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

/** The signed-in person's own page: who they are, and the things only they can change. */
export function ProfilePage() {
  const me = useMe();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [sound, setSound] = useState(isSoundEnabled);
  if (!me) return null;

  const details: [string, string | null][] = [
    ["Email", me.email],
    ["Role", ROLE_LABEL[me.role]],
    ["Designation", me.designation],
    ["Department", me.departmentName],
    ["Entity", me.entityName],
    ["Business unit", me.businessUnitName],
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader title="Profile" description="Your account details and security." />

      <section className="mb-6 rounded-xl border bg-card p-5" aria-labelledby="profile-details">
        <div className="mb-4 flex items-center gap-4">
          <span
            aria-hidden
            className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
          >
            {initials(me.fullName)}
          </span>
          <div className="min-w-0">
            <h2 id="profile-details" className="truncate text-lg font-semibold">
              {me.fullName}
            </h2>
            <p className="text-sm text-muted-foreground">{ROLE_LABEL[me.role]}</p>
          </div>
        </div>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="break-words text-sm">{value || "—"}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          To change these details, ask an administrator.
        </p>
      </section>

      {isSoundFeatureOn() && (
        <section
          className="mb-6 rounded-xl border bg-card p-5"
          aria-labelledby="profile-notifications"
        >
          <h2 id="profile-notifications" className="text-base font-semibold">
            Notifications
          </h2>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor="notification-sound">Play a sound for new notifications</Label>
              <p className="text-sm text-muted-foreground">
                A short chime while the app is open. This setting is saved on this device only.
              </p>
            </div>
            <Switch
              id="notification-sound"
              checked={sound}
              onCheckedChange={(on) => {
                setSound(on);
                setSoundEnabled(on);
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={playNotificationSound}
          >
            <Volume2 aria-hidden />
            Play sample
          </Button>
        </section>
      )}

      <section className="rounded-xl border bg-card p-5" aria-labelledby="profile-security">
        <h2 id="profile-security" className="text-base font-semibold">
          Password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Changing your password signs you out on every device.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => setPasswordOpen(true)}
        >
          <KeyRound aria-hidden />
          Change password
        </Button>
      </section>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  );
}
