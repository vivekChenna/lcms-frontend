import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { CaseDto } from "@/lib/api/types";
import { endOfDayISO } from "@/lib/format";
import { useChangeTargetDates } from "../use-case-actions";

type Props = {
  caseItem: Pick<CaseDto, "id" | "ackDueAt" | "resolutionDueAt">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const day = (iso: string) => format(parseISO(iso), "yyyy-MM-dd");

/**
 * Moves a case's deadlines (the acknowledgement date and the resolution date). Only the dates that
 * were actually changed are sent, and a reason is required: it goes into the audit trail.
 */
export function TargetDatesDialog({ caseItem, open, onOpenChange }: Props) {
  const change = useChangeTargetDates(caseItem.id);
  const [ack, setAck] = useState(day(caseItem.ackDueAt));
  const [resolution, setResolution] = useState(day(caseItem.resolutionDueAt));
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const ackChanged = ack !== day(caseItem.ackDueAt);
  const resolutionChanged = resolution !== day(caseItem.resolutionDueAt);
  const nothingChanged = !ackChanged && !resolutionChanged;
  const crossed = !!ack && !!resolution && ack > resolution;
  const reasonMissing = reason.trim().length < 3;

  const save = () => {
    setTouched(true);
    if (nothingChanged || crossed || reasonMissing || !ack || !resolution) return;
    const ackIso = ackChanged ? endOfDayISO(ack) : undefined;
    const resolutionIso = resolutionChanged ? endOfDayISO(resolution) : undefined;
    change.mutate(
      {
        ...(ackIso ? { ackDueAt: ackIso } : {}),
        ...(resolutionIso ? { resolutionDueAt: resolutionIso } : {}),
        reason: reason.trim(),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={change.isPending}
      title="Change target dates"
      description="Moves this case's deadlines. The reason is recorded in the audit trail."
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          loading={change.isPending}
          loadingText="Saving…"
          onClick={save}
        >
          Save dates
        </Button>
      }
    >
      <Label htmlFor="td-ack">Acknowledge by</Label>
      <DatePicker id="td-ack" value={ack} onChange={setAck} />

      <Label htmlFor="td-resolution" className="mt-4 block">
        Resolve by
      </Label>
      <DatePicker id="td-resolution" value={resolution} onChange={setResolution} />
      {crossed && (
        <p role="alert" className="mt-1 text-sm text-danger">
          The acknowledgement date cannot be after the resolution date.
        </p>
      )}

      <Label htmlFor="td-reason" className="mt-4 block">
        Reason
      </Label>
      <Textarea
        id="td-reason"
        className="mt-1"
        rows={3}
        placeholder="e.g. The counterparty asked for more time"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {touched && reasonMissing && (
        <p role="alert" className="mt-1 text-sm text-danger">
          Give a brief reason (at least 3 characters).
        </p>
      )}
      {touched && nothingChanged && (
        <p role="alert" className="mt-1 text-sm text-danger">
          Change at least one date.
        </p>
      )}
      {change.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {change.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}
