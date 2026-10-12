import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { useAcceptCase, useRejectCase } from "../use-case-actions";

/** Accept / Reject buttons for a case assigned to the caller (or any rep, for a manager). */
export function AcceptRejectActions({ caseId }: { caseId: string }) {
  const accept = useAcceptCase(caseId);
  const reject = useRejectCase(caseId);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const tooShort = reason.trim().length < 3;

  const openDialog = () => {
    setReason("");
    setTouched(false);
    setOpen(true);
  };

  const confirm = () => {
    setTouched(true);
    if (tooShort) return;
    reject.mutate(reason.trim(), { onSuccess: () => setOpen(false) });
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        className="h-11 lg:h-9"
        loading={accept.isPending}
        loadingText="Accepting…"
        onClick={() => accept.mutate()}
      >
        Accept
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 lg:h-9"
        onClick={openDialog}
      >
        Reject
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        pending={reject.isPending}
        title="Reject this assignment"
        description="Give a brief reason. The legal manager will see it and can reassign the case."
        footer={
          <Button
            type="button"
            className="h-11 lg:h-9"
            loading={reject.isPending}
            loadingText="Rejecting…"
            onClick={confirm}
          >
            Confirm
          </Button>
        }
      >
        <Label htmlFor="reject-reason">Reason</Label>
        <Textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="mt-1"
        />
        {touched && tooShort && (
          <p role="alert" className="mt-1 text-sm text-danger">
            The reason must be at least 3 characters.
          </p>
        )}
      </ResponsiveDialog>
    </div>
  );
}
