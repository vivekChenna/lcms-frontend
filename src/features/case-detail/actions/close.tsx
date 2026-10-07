import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { useClosureOutcomes } from "@/lib/queries/lookups";
import { useCloseCase } from "../use-case-actions";

type Props = {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Close a case: requires an outcome, a summary and an explicit confirmation checkbox.
 * A 409 (e.g. an open information request) shows the backend's message inline and leaves the
 * dialog open, rather than closing it as if the request had succeeded.
 */
export function CloseCaseDialog({ caseId, open, onOpenChange }: Props) {
  const { data: outcomes, isLoading } = useClosureOutcomes();
  const close = useCloseCase(caseId);
  const [outcomeId, setOutcomeId] = useState("");
  const [summary, setSummary] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const canSubmit = !!outcomeId && summary.trim().length > 0 && confirmed;

  const confirm = () => {
    if (!canSubmit) return;
    close.mutate(
      { confirm: true, closureSummary: summary.trim(), closureOutcomeId: outcomeId },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={close.isPending}
      title="Close this case"
      description="This cannot be undone. Any open information request must be resolved first."
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          disabled={!canSubmit || close.isPending}
          onClick={confirm}
        >
          Close case
        </Button>
      }
    >
      <Label htmlFor="close-outcome">Outcome</Label>
      <Select value={outcomeId} onValueChange={setOutcomeId} disabled={isLoading}>
        <SelectTrigger id="close-outcome" className="mt-1 h-11 lg:h-9">
          <SelectValue placeholder={isLoading ? "Loading…" : "Select an outcome"} />
        </SelectTrigger>
        <SelectContent>
          {outcomes?.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Label htmlFor="close-summary" className="mt-4 block">
        Summary
      </Label>
      <Textarea
        id="close-summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={4}
        className="mt-1"
      />

      <div className="mt-4 flex items-start gap-2">
        <Checkbox
          id="close-confirm"
          checked={confirmed}
          onCheckedChange={(v) => setConfirmed(v === true)}
        />
        <Label htmlFor="close-confirm" className="font-normal leading-snug">
          I confirm I want to close this case.
        </Label>
      </div>

      {close.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {close.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}
