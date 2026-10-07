import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { useEscalateCase } from "../use-case-actions";

type Props = {
  caseId: string;
  isEscalated: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Escalate (with a reason) or clear an existing escalation (no reason needed). */
export function EscalateDialog({ caseId, isEscalated, open, onOpenChange }: Props) {
  const escalate = useEscalateCase(caseId);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const tooShort = !isEscalated && reason.trim().length < 3;

  const confirm = () => {
    setTouched(true);
    if (tooShort) return;
    escalate.mutate(
      { isEscalated: !isEscalated, ...(isEscalated ? {} : { reason: reason.trim() }) },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={escalate.isPending}
      title={isEscalated ? "Clear escalation" : "Escalate this case"}
      description={
        isEscalated
          ? "This case will no longer be marked as escalated."
          : "Give a brief reason. Managers see escalated cases highlighted."
      }
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          disabled={escalate.isPending}
          onClick={confirm}
        >
          {isEscalated ? "Clear escalation" : "Escalate"}
        </Button>
      }
    >
      {!isEscalated && (
        <>
          <Label htmlFor="escalate-reason">Reason</Label>
          <Textarea
            id="escalate-reason"
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
        </>
      )}
      {escalate.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {escalate.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}
