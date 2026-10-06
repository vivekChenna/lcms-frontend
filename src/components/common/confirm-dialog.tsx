import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "./responsive-dialog";

type Props = {
  open: boolean;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  pending = false,
  onConfirm,
  onOpenChange,
}: Props) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      pending={pending}
      footer={
        <>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
