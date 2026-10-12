import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { CaseTypeDto } from "@/lib/api/types";
import { useUpdateCaseTypeMasterData } from "@/features/master-data/use-master-data";

type Props = { caseType: CaseTypeDto; open: boolean; onOpenChange: (open: boolean) => void };

const isWholeHours = (v: string) => Number.isInteger(Number(v)) && Number(v) > 0;

/** Changes how long legal has to acknowledge and to resolve one type of case. */
export function SlaEditDialog({ caseType, open, onOpenChange }: Props) {
  const update = useUpdateCaseTypeMasterData(caseType.id);
  const [ack, setAck] = useState(String(caseType.slaAckHours));
  const [resolution, setResolution] = useState(String(caseType.slaResolutionHours));
  const [touched, setTouched] = useState(false);

  const invalid = !isWholeHours(ack) || !isWholeHours(resolution);
  const resolutionShorter =
    isWholeHours(ack) && isWholeHours(resolution) && Number(resolution) < Number(ack);

  const save = () => {
    setTouched(true);
    if (invalid || resolutionShorter) return;
    update.mutate(
      { slaAckHours: Number(ack), slaResolutionHours: Number(resolution) },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={update.isPending}
      title={`Edit SLA: ${caseType.name}`}
      description="Applies to cases submitted from now on. Cases already open keep the deadline they were given."
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          loading={update.isPending}
          loadingText="Saving…"
          onClick={save}
        >
          Save changes
        </Button>
      }
    >
      <Label htmlFor="sla-ack">Acknowledge within (hours)</Label>
      <Input
        id="sla-ack"
        type="number"
        min={1}
        className="mt-1 h-11 lg:h-9"
        value={ack}
        onChange={(e) => setAck(e.target.value)}
      />
      <Label htmlFor="sla-resolution" className="mt-4 block">
        Resolve within (hours)
      </Label>
      <Input
        id="sla-resolution"
        type="number"
        min={1}
        className="mt-1 h-11 lg:h-9"
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
      />
      {touched && invalid && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Enter a whole number of hours, 1 or more, in both fields.
        </p>
      )}
      {touched && !invalid && resolutionShorter && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Resolution time cannot be shorter than the acknowledgement time.
        </p>
      )}
      {update.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {update.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}
